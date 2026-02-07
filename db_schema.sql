
-- 1. تنظيف شامل (حذف الجداول القديمة لإعادة البناء)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS advances CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. تفعيل الإضافات
create extension if not exists "pgcrypto";

-- 3. إنشاء الجداول

-- جدول المستخدمين
create table users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  password text not null, 
  role text not null, 
  "avatarUrl" text,
  phone text,
  "jobTitle" text,
  "managerId" uuid, 
  "rootAdminId" uuid, 
  preferences jsonb default '{"soundEnabled": true}',
  "createdAt" timestamptz default now()
);

-- جدول المشاريع
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text,
  "managerId" uuid, 
  status text default 'ACTIVE',
  "createdAt" timestamptz default now()
);

-- جدول العهد
create table advances (
  id uuid default gen_random_uuid() primary key,
  "projectId" uuid references projects(id) on delete cascade,
  "userId" uuid references users(id) on delete cascade,
  amount numeric default 0,
  "remainingAmount" numeric default 0,
  description text,
  status text default 'PENDING',
  date text,
  "rejectionReason" text,
  "settlementData" jsonb,
  "createdAt" timestamptz default now()
);

-- جدول المصروفات
create table expenses (
  id uuid default gen_random_uuid() primary key,
  "advanceId" uuid references advances(id) on delete cascade,
  "userId" uuid references users(id) on delete cascade,
  amount numeric default 0,
  description text,
  notes text,
  category text default 'General',
  "imageUrl" text,
  status text default 'PENDING',
  date text,
  "rejectionReason" text,
  "isEditable" boolean default false,
  "isInvoice" boolean default false,
  "invoiceItems" jsonb,
  "additionalAmount" numeric default 0,
  "createdAt" timestamptz default now()
);

-- جدول الإشعارات (محدث لدعم التوجيه)
create table notifications (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references users(id) on delete cascade, -- الشخص الذي سيتلقى الإشعار
  title text not null,
  message text not null,
  type text default 'info', -- info, success, warning, error
  "isRead" boolean default false,
  
  -- بيانات التوجيه
  "targetPage" text, -- dashboard, advances, etc.
  "targetId" text,   -- expense_id, advance_id
  
  "createdAt" timestamptz default now()
);

-- 4. سياسات الأمان (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Advances" ON advances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- 5. التخزين (Storage)
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true) on conflict (id) do nothing;
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
create policy "Public Select" on storage.objects for select using ( bucket_id = 'uploads' );
create policy "Public Insert" on storage.objects for insert with check ( bucket_id = 'uploads' );

-- 6. دوال التنبيهات التلقائية (Database Triggers)

-- دالة: عند إنشاء مصروف جديد -> إشعار للمدير/المحاسب
CREATE OR REPLACE FUNCTION notify_new_expense() RETURNS TRIGGER AS $$
DECLARE
  manager_id UUID;
  user_name TEXT;
BEGIN
  -- جلب اسم الموظف ومديره (أو الروت أدمن)
  SELECT name, COALESCE("managerId", "rootAdminId") INTO user_name, manager_id FROM users WHERE id = NEW."userId";
  
  IF manager_id IS NOT NULL AND NEW.status = 'PENDING' THEN
    INSERT INTO notifications ("userId", title, message, type, "targetPage", "targetId")
    VALUES (manager_id, 'مصروف جديد', 'قام ' || user_name || ' بإضافة مصروف جديد بقيمة ' || NEW.amount, 'info', 'dashboard', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_expense
AFTER INSERT ON expenses
FOR EACH ROW EXECUTE FUNCTION notify_new_expense();

-- دالة: عند تغيير حالة المصروف (موافقة/رفض) -> إشعار للموظف
CREATE OR REPLACE FUNCTION notify_expense_status() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'APPROVED' THEN
       INSERT INTO notifications ("userId", title, message, type, "targetPage", "targetId")
       VALUES (NEW."userId", 'تمت الموافقة', 'تمت الموافقة على المصروف: ' || NEW.description, 'success', 'dashboard', NEW.id);
    ELSIF NEW.status = 'REJECTED' THEN
       INSERT INTO notifications ("userId", title, message, type, "targetPage", "targetId")
       VALUES (NEW."userId", 'تم الرفض', 'تم رفض المصروف: ' || NEW.description, 'error', 'dashboard', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expense_status
AFTER UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION notify_expense_status();

-- دالة: عند إنشاء عهدة جديدة -> إشعار للمدير
CREATE OR REPLACE FUNCTION notify_new_advance() RETURNS TRIGGER AS $$
DECLARE
  manager_id UUID;
  user_name TEXT;
BEGIN
  SELECT name, COALESCE("managerId", "rootAdminId") INTO user_name, manager_id FROM users WHERE id = NEW."userId";
  
  IF manager_id IS NOT NULL AND NEW.status = 'PENDING' THEN
    INSERT INTO notifications ("userId", title, message, type, "targetPage", "targetId")
    VALUES (manager_id, 'طلب عهدة جديد', 'طلب ' || user_name || ' عهدة جديدة بقيمة ' || NEW.amount, 'warning', 'dashboard', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_advance
AFTER INSERT ON advances
FOR EACH ROW EXECUTE FUNCTION notify_new_advance();

-- دالة: عند تغيير حالة العهدة -> إشعار للموظف
CREATE OR REPLACE FUNCTION notify_advance_status() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'OPEN' THEN
       INSERT INTO notifications ("userId", title, message, type, "targetPage", "targetId")
       VALUES (NEW."userId", 'تم صرف العهدة', 'تمت الموافقة على العهدة: ' || NEW.description, 'success', 'advances', NEW.id);
    ELSIF NEW.status = 'REJECTED' THEN
       INSERT INTO notifications ("userId", title, message, type, "targetPage", "targetId")
       VALUES (NEW."userId", 'تم الرفض', 'تم رفض طلب العهدة: ' || NEW.description, 'error', 'advances', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_advance_status
AFTER UPDATE ON advances
FOR EACH ROW EXECUTE FUNCTION notify_advance_status();


-- 7. البيانات الأولية
INSERT INTO users (id, name, email, password, role, "jobTitle", "avatarUrl", "rootAdminId") VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Mohsen Baza', 'Mohsen.baza@petrotec-eng.net', 'Mohsen12--', 'ADMIN', 'Senior Accountant', 'https://ui-avatars.com/api/?name=Mohsen+Baza&background=0D8ABC&color=fff', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
INSERT INTO users (id, name, email, password, role, "jobTitle", "avatarUrl", "rootAdminId") VALUES ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Sameh Elgendy', 'sameh.elgendy@petrotec-eng.net', 'Sameh12--', 'ADMIN', 'Senior Accountant', 'https://ui-avatars.com/api/?name=Sameh+Elgendy&background=6366f1&color=fff', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22');
INSERT INTO users (name, email, password, role, "jobTitle", "managerId", "rootAdminId") VALUES ('م. أحمد علي (محسن)', 'ahmed@petrotec.com', '123', 'ENGINEER', 'Site Engineer', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
INSERT INTO projects (name, location, "managerId", status) VALUES ('مشروع صيانة البرج - القاهرة', 'القاهرة', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ACTIVE');

-- 8. تفعيل Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table projects, advances, expenses, users, notifications;

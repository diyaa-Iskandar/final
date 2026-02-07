
# تعليمات تشغيل نظام PETROTEC مع Supabase

تم ربط النظام بقاعدة بيانات سحابية (Supabase) مع تحسينات أمنية.

## خطوات التشغيل الهامة:

### 1. إعداد متغيرات البيئة (Environment Variables)
يجب إنشاء ملف `.env` في المجلد الرئيسي للمشروع وإضافة المفاتيح الخاصة بك من لوحة تحكم Supabase:

1. انسخ ملف `.env.example` (إن وجد) أو أنشئ ملفاً جديداً باسم `.env`.
2. أضف المحتوى التالي:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**ملاحظة:** تأكد من استخدام `ANON KEY` وليس `SERVICE ROLE KEY` للحفاظ على الأمان.

### 2. إعداد قاعدة البيانات
1. افتح الملف `db_schema.sql` في هذا المشروع.
2. انسخ محتواه بالكامل.
3. اذهب إلى لوحة تحكم Supabase الخاصة بك.
4. اختر **SQL Editor** من القائمة الجانبية.
5. الصق الكود واضغط **Run**.

### 3. التشغيل
الآن يمكنك تشغيل الموقع:
```bash
npm run dev
```

## بيانات الدخول الافتراضية
- **البريد:** Mohsen.baza@petrotec-eng.net
- **كلمة المرور:** Mohsen12--

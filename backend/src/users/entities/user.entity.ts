import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Advance } from '../../advances/entities/advance.entity';
import { Expense } from '../../expenses/entities/expense.entity';

export enum UserRole {
  ADMIN = 'ADMIN',         // محاسب / مدير نظام
  ENGINEER = 'ENGINEER',   // مهندس موقع
  TECHNICIAN = 'TECHNICIAN' // فني
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // إخفاء كلمة المرور عند الاسترجاع الافتراضي
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TECHNICIAN
  })
  role: UserRole;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatarUrl: string;

  // الهرم الإداري: المدير المباشر
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'managerId' })
  manager: User;

  @Column({ nullable: true })
  managerId: string;

  // العلاقات
  @OneToMany(() => Advance, (advance) => advance.user)
  advances: Advance[];

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses: Expense[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

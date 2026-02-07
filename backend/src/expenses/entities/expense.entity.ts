import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Advance } from '../../advances/entities/advance.entity';

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  imageUrl: string; // رابط الصورة المرفوعة

  @Column({ type: 'date' })
  date: string; // تاريخ المصروف الفعلي

  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.PENDING
  })
  status: ExpenseStatus;

  @Column({ default: false })
  isEditable: boolean; // هل سمح المحاسب بالتعديل؟

  // نوع المصروف: مبلغ ثابت أم فاتورة تفصيلية
  @Column({ default: false })
  isInvoice: boolean;

  // تخزين بنود الفاتورة كـ JSON لتجنب تعقيد الجداول
  @Column('jsonb', { nullable: true })
  invoiceItems: {
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];

  @Column('decimal', { precision: 12, scale: 2, default: 0, nullable: true })
  additionalAmount: number;

  @ManyToOne(() => Advance, (advance) => advance.expenses)
  @JoinColumn({ name: 'advanceId' })
  advance: Advance;

  @Column()
  advanceId: string;

  @ManyToOne(() => User, (user) => user.expenses)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

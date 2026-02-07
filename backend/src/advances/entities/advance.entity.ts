import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Expense } from '../../expenses/entities/expense.entity';

export enum AdvanceStatus {
  PENDING = 'PENDING',  // طلب جديد
  OPEN = 'OPEN',        // موافق عليه وساري
  CLOSED = 'CLOSED',    // مغلق (تمت التسوية)
  REJECTED = 'REJECTED' // مرفوض
}

@Entity('advances')
export class Advance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number; // القيمة الأصلية للعهدة

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  remainingAmount: number; // القيمة المتبقية

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: AdvanceStatus,
    default: AdvanceStatus.PENDING
  })
  status: AdvanceStatus;

  // ربط العهدة بالمشروع (يمكن أن يكون كيان منفصل، هنا نص للتبسيط مبدئياً)
  @Column({ nullable: true })
  projectId: string; 

  @ManyToOne(() => User, (user) => user.advances)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Expense, (expense) => expense.advance)
  expenses: Expense[];

  // بيانات التسوية (تعبأ عند الإغلاق)
  @Column('jsonb', { nullable: true })
  settlementData: {
    totalApprovedExpenses: number;
    returnedCashAmount: number;
    deficitAmount: number;
    notes?: string;
  };

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

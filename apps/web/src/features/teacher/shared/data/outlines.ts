export interface Exercise {
  id: string
  title: string
  questionIds: string[]
}

export interface Section {
  id: string
  title: string
  expanded: boolean
  exercises: Exercise[]
}

export interface Outline {
  id: string
  title: string
  createdAt: string
  sections: Section[]
}

export const seedOutlines: Outline[] = [
  {
    id: 'o1', title: 'Toán 10A — Đề cương học kỳ 1', createdAt: '2026-08-10',
    sections: [
      {
        id: 's1', title: 'Mục 1: Hàm số và Đồ thị', expanded: true,
        exercises: [
          { id: 'e1', title: 'Bài tập nhận biết hàm số', questionIds: ['q1', 'q3'] },
          { id: 'e2', title: 'Kiểm tra nhanh định nghĩa', questionIds: [] },
        ],
      },
      {
        id: 's2', title: 'Mục 2: Phương trình bậc hai', expanded: false,
        exercises: [{ id: 'e3', title: 'Luyện giải phương trình', questionIds: ['q1'] }],
      },
    ],
  },
  {
    id: 'o2', title: 'Toán 11B — Đề cương giữa kỳ', createdAt: '2026-08-15',
    sections: [
      {
        id: 's3', title: 'Mục 1: Đạo hàm', expanded: true,
        exercises: [{ id: 'e4', title: 'Bài tập tính đạo hàm', questionIds: ['q4', 'q5'] }],
      },
    ],
  },
]

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
      {
        id: 's3b', title: 'Mục 2: Quan hệ song song', expanded: false,
        exercises: [{ id: 'e4b', title: 'Bài tập hình học không gian', questionIds: ['q9', 'q10'] }],
      },
    ],
  },
  {
    id: 'o3', title: 'Lý 12C — Đề cương học kỳ 1', createdAt: '2026-08-12',
    sections: [
      {
        id: 's4', title: 'Mục 1: Dao động cơ', expanded: true,
        exercises: [
          { id: 'e5', title: 'Bài tập dao động điều hòa', questionIds: ['q6'] },
          { id: 'e6', title: 'Kiểm tra nhanh con lắc', questionIds: [] },
        ],
      },
      {
        id: 's5', title: 'Mục 2: Sóng cơ', expanded: false,
        exercises: [{ id: 'e7', title: 'Bài tập sóng âm', questionIds: ['q8'] }],
      },
    ],
  },
  {
    id: 'o4', title: 'Hóa 10D — Đề cương đầu năm', createdAt: '2026-08-20',
    sections: [
      {
        id: 's6', title: 'Mục 1: Nguyên tử', expanded: true,
        exercises: [{ id: 'e8', title: 'Bài tập cấu tạo nguyên tử', questionIds: ['q1', 'q2'] }],
      },
      {
        id: 's7', title: 'Mục 2: Bảng tuần hoàn', expanded: false,
        exercises: [{ id: 'e9', title: 'Luyện tập bảng tuần hoàn', questionIds: [] }],
      },
    ],
  },
]

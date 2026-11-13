'use client';
export default function ErrorPage({reset}: {error: Error; reset: () => void}) {
  return <main><h1>Không thể hiển thị trang</h1><button onClick={reset}>Thử lại</button></main>;
}

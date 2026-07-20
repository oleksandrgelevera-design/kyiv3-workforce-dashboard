import { redirect } from 'next/navigation';

export default function Home() {
  // Перенаправляємо відразу на головний дашборд без перевірок
  redirect('/dashboard'); 
}

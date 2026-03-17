/**
 * Layout do Quiz Plenipay — landing interativa (URL: /quizplenipay).
 * Full viewport, sem sidebar/nav para experiência imersiva.
 */
export const metadata = {
  title: 'Diagnóstico Financeiro | Plenipay',
  description: 'Descubra em 1 minuto como melhorar sua vida financeira com a Plenipay pelo WhatsApp.',
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="quiz-layout min-h-screen w-full bg-white"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {children}
    </div>
  )
}

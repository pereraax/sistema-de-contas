import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import Logo from '@/components/Logo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const metadata = {
  title: 'Termos de Uso - PLENIPAY',
  description: 'Termos e condições de uso da plataforma PLENIPAY',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-brand-clean dark:bg-brand-midnight">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-brand-aqua hover:text-brand-aqua/80 transition-smooth mb-6"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-brand-aqua" size={32} />
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-brand-midnight dark:text-brand-clean">
              Termos de Uso
            </h1>
          </div>
          <p className="text-brand-midnight/70 dark:text-brand-clean/70">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="bg-brand-white dark:bg-brand-royal rounded-2xl p-6 sm:p-8 shadow-lg border border-brand-clean dark:border-white/10 space-y-6 text-brand-midnight dark:text-brand-clean">
          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">1. Aceitação dos Termos</h2>
            <p className="leading-relaxed">
              Ao acessar e utilizar a plataforma PLENIPAY, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. 
              Se você não concorda com qualquer parte destes termos, não deve utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">2. Descrição do Serviço</h2>
            <p className="leading-relaxed mb-3">
              O PLENIPAY é uma plataforma de gestão financeira pessoal que oferece:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Controle de receitas e despesas</li>
              <li>Gerenciamento de dívidas e empréstimos</li>
              <li>Metas de economia e cofrinhos</li>
              <li>Relatórios e análises financeiras</li>
              <li>Assistente virtual inteligente (PLEN AI)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">3. Cadastro e Conta de Usuário</h2>
            <p className="leading-relaxed mb-3">
              Para utilizar nossos serviços, você precisa criar uma conta fornecendo informações precisas e atualizadas. 
              Você é responsável por:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
              <li>Ser responsável por todas as atividades que ocorram em sua conta</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">4. Planos e Pagamentos</h2>
            <p className="leading-relaxed mb-3">
              Oferecemos diferentes planos de assinatura com funcionalidades variadas:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Plano Teste:</strong> Acesso gratuito com funcionalidades limitadas</li>
              <li><strong>Plano Básico:</strong> Acesso a funcionalidades essenciais mediante pagamento mensal</li>
              <li><strong>Plano Premium:</strong> Acesso completo a todas as funcionalidades</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Os pagamentos são processados de forma segura através de parceiros de pagamento. 
              As assinaturas são renovadas automaticamente, a menos que canceladas pelo usuário.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">5. Uso Adequado</h2>
            <p className="leading-relaxed mb-3">
              Você concorda em usar a plataforma apenas para fins legais e de acordo com estes termos. 
              É proibido:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Usar a plataforma para atividades ilegais ou fraudulentas</li>
              <li>Tentar acessar áreas restritas ou sistemas não autorizados</li>
              <li>Interferir ou interromper o funcionamento da plataforma</li>
              <li>Reproduzir, copiar ou revender qualquer parte do serviço</li>
              <li>Usar bots, scripts ou métodos automatizados sem autorização</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">6. Propriedade Intelectual</h2>
            <p className="leading-relaxed">
              Todo o conteúdo da plataforma, incluindo design, código, textos, gráficos, logotipos e software, 
              é propriedade do PLENIPAY ou de seus licenciadores e está protegido por leis de direitos autorais 
              e outras leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">7. Privacidade e Dados</h2>
            <p className="leading-relaxed">
              O tratamento de seus dados pessoais é regido por nossa Política de Privacidade, 
              que faz parte integrante destes Termos de Uso. Ao usar nossos serviços, você concorda 
              com a coleta e uso de informações conforme descrito na Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">8. Limitação de Responsabilidade</h2>
            <p className="leading-relaxed mb-3">
              O PLENIPAY fornece a plataforma "como está" e não garante que:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>O serviço será ininterrupto, seguro ou livre de erros</li>
              <li>Os resultados obtidos serão precisos ou confiáveis</li>
              <li>Os defeitos serão corrigidos</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Não nos responsabilizamos por perdas financeiras ou danos decorrentes do uso ou 
              impossibilidade de uso da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">9. Modificações dos Termos</h2>
            <p className="leading-relaxed">
              Reservamos o direito de modificar estes termos a qualquer momento. 
              As alterações entrarão em vigor imediatamente após a publicação. 
              O uso continuado da plataforma após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">10. Cancelamento e Rescisão</h2>
            <p className="leading-relaxed mb-3">
              Você pode cancelar sua conta a qualquer momento através das configurações da plataforma. 
              Podemos suspender ou encerrar sua conta se você violar estes termos.
            </p>
            <p className="leading-relaxed">
              Em caso de cancelamento, você perderá o acesso aos dados armazenados na plataforma, 
              conforme nossa Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">11. Lei Aplicável</h2>
            <p className="leading-relaxed">
              Estes termos são regidos pelas leis brasileiras. 
              Qualquer disputa será resolvida nos tribunais competentes do Brasil.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">12. Contato</h2>
            <p className="leading-relaxed">
              Para questões sobre estes Termos de Uso, entre em contato conosco através da página de 
              <Link href="/suporte" className="text-brand-aqua hover:underline"> Suporte</Link> ou 
              pelo chat disponível na plataforma.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-brand-midnight/60 dark:text-brand-clean/60 text-sm">
          <p>© 2025 PLENIPAY. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

















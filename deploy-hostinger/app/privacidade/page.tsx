import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade - PLENIPAY',
  description: 'Política de privacidade e proteção de dados da plataforma PLENIPAY',
}

export default function PrivacidadePage() {
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
            <Shield className="text-brand-aqua" size={32} />
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-brand-midnight dark:text-brand-clean">
              Política de Privacidade
            </h1>
          </div>
          <p className="text-brand-midnight/70 dark:text-brand-clean/70">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="bg-brand-white dark:bg-brand-royal rounded-2xl p-6 sm:p-8 shadow-lg border border-brand-clean dark:border-white/10 space-y-6 text-brand-midnight dark:text-brand-clean">
          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">1. Introdução</h2>
            <p className="leading-relaxed">
              O PLENIPAY está comprometido em proteger sua privacidade e garantir a segurança de seus dados pessoais. 
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações 
              quando você utiliza nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">2. Informações que Coletamos</h2>
            <h3 className="text-xl font-semibold mb-3 mt-4">2.1. Dados de Cadastro</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone e WhatsApp</li>
              <li>Senha (criptografada)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.2. Dados Financeiros</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Registros de receitas e despesas</li>
              <li>Informações sobre dívidas e empréstimos</li>
              <li>Metas de economia</li>
              <li>Histórico de transações</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4">2.3. Dados de Uso</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Logs de acesso e atividade</li>
              <li>Preferências e configurações</li>
              <li>Interações com o assistente virtual (PLEN AI)</li>
              <li>Informações de dispositivo e navegador</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">3. Como Usamos suas Informações</h2>
            <p className="leading-relaxed mb-3">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Personalizar sua experiência na plataforma</li>
              <li>Enviar notificações e comunicações importantes</li>
              <li>Garantir a segurança e prevenir fraudes</li>
              <li>Cumprir obrigações legais</li>
              <li>Gerar relatórios e análises financeiras</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">4. Compartilhamento de Dados</h2>
            <p className="leading-relaxed mb-3">
              Não vendemos seus dados pessoais. Podemos compartilhar informações apenas nas seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Prestadores de Serviço:</strong> Parceiros que nos ajudam a operar a plataforma (processamento de pagamentos, hospedagem, etc.)</li>
              <li><strong>Obrigações Legais:</strong> Quando exigido por lei ou ordem judicial</li>
              <li><strong>Proteção de Direitos:</strong> Para proteger nossos direitos, propriedade ou segurança</li>
              <li><strong>Com seu Consentimento:</strong> Quando você autorizar explicitamente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">5. Segurança dos Dados</h2>
            <p className="leading-relaxed mb-3">
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Autenticação segura e controle de acesso</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares dos dados</li>
              <li>Conformidade com padrões de segurança da indústria</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">6. Seus Direitos (LGPD)</h2>
            <p className="leading-relaxed mb-3">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Acesso:</strong> Solicitar informações sobre seus dados pessoais</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou desatualizados</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão de dados desnecessários</li>
              <li><strong>Portabilidade:</strong> Solicitar a transferência de seus dados</li>
              <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em certas circunstâncias</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Para exercer seus direitos, entre em contato conosco através da página de 
              <Link href="/suporte" className="text-brand-aqua hover:underline"> Suporte</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">7. Retenção de Dados</h2>
            <p className="leading-relaxed">
              Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, 
              ou conforme exigido por lei. Quando você cancela sua conta, podemos reter certas informações por períodos 
              específicos para fins legais, contábeis ou de segurança.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">8. Cookies e Tecnologias Similares</h2>
            <p className="leading-relaxed mb-3">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Manter sua sessão ativa</li>
              <li>Lembrar suas preferências</li>
              <li>Analisar o uso da plataforma</li>
              <li>Melhorar a experiência do usuário</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Você pode gerenciar as preferências de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">9. Menores de Idade</h2>
            <p className="leading-relaxed">
              Nossos serviços são destinados a pessoas maiores de 18 anos. Não coletamos intencionalmente dados de menores de idade. 
              Se tomarmos conhecimento de que coletamos dados de um menor, tomaremos medidas para excluir essas informações.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">10. Alterações nesta Política</h2>
            <p className="leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas 
              através de e-mail ou avisos na plataforma. Recomendamos que revise esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold mb-4 text-brand-aqua">11. Contato</h2>
            <p className="leading-relaxed">
              Para questões sobre privacidade ou para exercer seus direitos, entre em contato conosco através da página de 
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
















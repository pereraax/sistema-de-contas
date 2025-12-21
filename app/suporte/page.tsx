'use client'

import Link from 'next/link'
import { ArrowLeft, MessageCircle, Mail, HelpCircle, Book, MessageSquare, Clock } from 'lucide-react'
import { useState } from 'react'

export default function SuportePage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'faq' | 'contato'>('chat')

  const faqItems = [
    {
      pergunta: 'Como criar uma conta?',
      resposta: 'Para criar uma conta, clique em "Cadastrar" na página inicial, preencha seus dados e confirme seu e-mail. Você pode começar com o plano teste gratuito!'
    },
    {
      pergunta: 'Quais são os planos disponíveis?',
      resposta: 'Oferecemos três planos: Teste (gratuito com funcionalidades limitadas), Básico (R$ 29,90/mês) e Premium (R$ 49,90/mês) com acesso completo a todas as funcionalidades.'
    },
    {
      pergunta: 'Como cancelar minha assinatura?',
      resposta: 'Você pode cancelar sua assinatura a qualquer momento nas Configurações da sua conta. O cancelamento será efetivado no final do período pago.'
    },
    {
      pergunta: 'Meus dados estão seguros?',
      resposta: 'Sim! Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados financeiros são armazenados de forma segura e nunca são compartilhados com terceiros sem sua autorização.'
    },
    {
      pergunta: 'Como usar o PLEN AI?',
      resposta: 'O PLEN AI é nosso assistente virtual inteligente. Basta clicar no botão flutuante na parte inferior da tela e começar a conversar! Você pode registrar gastos, consultar dívidas, verificar saldo e muito mais.'
    },
    {
      pergunta: 'Como gerenciar minhas dívidas?',
      resposta: 'Acesse a seção "Dívidas" no menu. Lá você pode adicionar novas dívidas, registrar pagamentos, visualizar o progresso e gerenciar parcelas. Funcionalidade disponível nos planos Básico e Premium.'
    },
    {
      pergunta: 'Como criar metas de economia?',
      resposta: 'Vá até "Minhas Metas" no menu, clique em "Nova Meta" e defina seu objetivo. Você pode acompanhar o progresso e coletar baús de tesouro para acelerar sua economia!'
    },
    {
      pergunta: 'Esqueci minha senha, o que fazer?',
      resposta: 'Na página de login, clique em "Esqueci minha senha" e siga as instruções para redefinir sua senha através do e-mail cadastrado.'
    }
  ]

  return (
    <div className="min-h-screen bg-brand-clean dark:bg-brand-midnight">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
            <MessageCircle className="text-brand-aqua" size={32} />
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-brand-midnight dark:text-brand-clean">
              Central de Suporte
            </h1>
          </div>
          <p className="text-brand-midnight/70 dark:text-brand-clean/70">
            Estamos aqui para ajudar! Escolha a melhor forma de entrar em contato.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-brand-clean dark:border-white/10">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 font-medium transition-smooth border-b-2 ${
              activeTab === 'chat'
                ? 'border-brand-aqua text-brand-aqua'
                : 'border-transparent text-brand-midnight/60 dark:text-brand-clean/60 hover:text-brand-aqua'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={20} />
              <span>Chat ao Vivo</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3 font-medium transition-smooth border-b-2 ${
              activeTab === 'faq'
                ? 'border-brand-aqua text-brand-aqua'
                : 'border-transparent text-brand-midnight/60 dark:text-brand-clean/60 hover:text-brand-aqua'
            }`}
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={20} />
              <span>Perguntas Frequentes</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('contato')}
            className={`px-6 py-3 font-medium transition-smooth border-b-2 ${
              activeTab === 'contato'
                ? 'border-brand-aqua text-brand-aqua'
                : 'border-transparent text-brand-midnight/60 dark:text-brand-clean/60 hover:text-brand-aqua'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail size={20} />
              <span>Outros Contatos</span>
            </div>
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="bg-brand-white dark:bg-brand-royal rounded-2xl p-6 sm:p-8 shadow-lg border border-brand-clean dark:border-white/10">
          {/* Chat ao Vivo */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-aqua/10 rounded-lg">
                  <MessageSquare className="text-brand-aqua" size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-bold mb-2 text-brand-midnight dark:text-brand-clean">
                    Chat de Suporte ao Vivo
                  </h2>
                  <p className="text-brand-midnight/70 dark:text-brand-clean/70 mb-4">
                    Converse diretamente com nossa equipe de suporte através do chat disponível na plataforma. 
                    Nossos atendentes estão prontos para ajudar você!
                  </p>
                  <div className="flex items-center gap-2 text-sm text-brand-midnight/60 dark:text-brand-clean/60 mb-4">
                    <Clock size={16} />
                    <span>Horário de atendimento: Segunda a Sexta, 9h às 18h (horário de Brasília)</span>
                  </div>
                  <div className="bg-brand-aqua/5 dark:bg-brand-aqua/10 rounded-lg p-4 border border-brand-aqua/20">
                    <p className="text-sm text-brand-midnight dark:text-brand-clean mb-2">
                      <strong>Como acessar:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-brand-midnight/80 dark:text-brand-clean/80">
                      <li>Faça login na plataforma</li>
                      <li>Procure pelo ícone de chat no canto inferior direito</li>
                      <li>Clique e inicie uma conversa com nosso suporte</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-brand-aqua/10 rounded-lg">
                  <HelpCircle className="text-brand-aqua" size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-bold mb-2 text-brand-midnight dark:text-brand-clean">
                    Perguntas Frequentes
                  </h2>
                  <p className="text-brand-midnight/70 dark:text-brand-clean/70">
                    Encontre respostas rápidas para as dúvidas mais comuns.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <details
                    key={index}
                    className="bg-brand-clean/50 dark:bg-brand-midnight/50 rounded-lg p-4 border border-brand-clean dark:border-white/10"
                  >
                    <summary className="font-semibold text-brand-midnight dark:text-brand-clean cursor-pointer hover:text-brand-aqua transition-smooth">
                      {item.pergunta}
                    </summary>
                    <p className="mt-3 text-brand-midnight/80 dark:text-brand-clean/80 leading-relaxed">
                      {item.resposta}
                    </p>
                  </details>
                ))}
              </div>

              <div className="mt-6 bg-brand-aqua/5 dark:bg-brand-aqua/10 rounded-lg p-4 border border-brand-aqua/20">
                <p className="text-sm text-brand-midnight dark:text-brand-clean">
                  <strong>Não encontrou sua resposta?</strong> Entre em contato conosco através do chat ao vivo ou 
                  pelos outros canais de contato disponíveis.
                </p>
              </div>
            </div>
          )}

          {/* Outros Contatos */}
          {activeTab === 'contato' && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-brand-aqua/10 rounded-lg">
                  <Mail className="text-brand-aqua" size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-bold mb-2 text-brand-midnight dark:text-brand-clean">
                    Outros Canais de Contato
                  </h2>
                  <p className="text-brand-midnight/70 dark:text-brand-clean/70">
                    Escolha a forma de contato que preferir.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-brand-clean/50 dark:bg-brand-midnight/50 rounded-lg p-6 border border-brand-clean dark:border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="text-brand-aqua" size={24} />
                    <h3 className="text-xl font-semibold text-brand-midnight dark:text-brand-clean">
                      E-mail
                    </h3>
                  </div>
                  <p className="text-brand-midnight/70 dark:text-brand-clean/70 mb-2">
                    Envie-nos um e-mail e responderemos o mais rápido possível.
                  </p>
                  <a
                    href="mailto:suporte@plenipay.com"
                    className="text-brand-aqua hover:underline font-medium"
                  >
                    suporte@plenipay.com
                  </a>
                </div>

                <div className="bg-brand-clean/50 dark:bg-brand-midnight/50 rounded-lg p-6 border border-brand-clean dark:border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Book className="text-brand-aqua" size={24} />
                    <h3 className="text-xl font-semibold text-brand-midnight dark:text-brand-clean">
                      Documentação
                    </h3>
                  </div>
                  <p className="text-brand-midnight/70 dark:text-brand-clean/70 mb-2">
                    Acesse nossa documentação completa e tutoriais.
                  </p>
                  <Link
                    href="/tutoriais"
                    className="text-brand-aqua hover:underline font-medium"
                  >
                    Ver Tutoriais →
                  </Link>
                </div>
              </div>

              <div className="bg-brand-aqua/5 dark:bg-brand-aqua/10 rounded-lg p-4 border border-brand-aqua/20">
                <p className="text-sm text-brand-midnight dark:text-brand-clean">
                  <strong>Dica:</strong> Para questões urgentes, recomendamos usar o chat ao vivo. 
                  Para dúvidas sobre termos e privacidade, consulte nossas páginas de 
                  <Link href="/termos" className="text-brand-aqua hover:underline mx-1">Termos de Uso</Link>
                  e
                  <Link href="/privacidade" className="text-brand-aqua hover:underline mx-1">Política de Privacidade</Link>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-brand-midnight/60 dark:text-brand-clean/60 text-sm">
          <p>© 2025 PLENIPAY. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

















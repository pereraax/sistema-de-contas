/**
 * Gera um nome brasileiro fictício aleatório
 * Retorna um nome completo (primeiro nome + sobrenome)
 */
export function gerarNomeBrasileiro(): string {
  const nomes = [
    'João', 'Maria', 'José', 'Ana', 'Carlos', 'Fernanda', 'Paulo', 'Juliana',
    'Ricardo', 'Mariana', 'Pedro', 'Carla', 'Lucas', 'Beatriz', 'Rodrigo', 'Gabriela',
    'Bruno', 'Amanda', 'Thiago', 'Larissa', 'Felipe', 'Patricia', 'Rafael', 'Camila',
    'André', 'Vanessa', 'Marcos', 'Daniela', 'Gustavo', 'Isabela', 'Renato', 'Priscila',
    'Diego', 'Juliana', 'Eduardo', 'Fernanda', 'Vinicius', 'Mariana', 'Gabriel', 'Bruna',
    'Henrique', 'Natália', 'Matheus', 'Tatiana', 'Leonardo', 'Renata', 'Samuel', 'Cristina',
    'Alexandre', 'Leticia', 'Fabio', 'Adriana', 'Daniel', 'Simone', 'Antonio', 'Sandra',
    'Ronaldo', 'Monica', 'Wagner', 'Roberta', 'Fernando', 'Silvia', 'Marcelo', 'Lucia'
  ]
  
  const sobrenomes = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
    'Lima', 'Gomes', 'Ribeiro', 'Carvalho', 'Almeida', 'Costa', 'Martins', 'Mendes',
    'Barbosa', 'Rocha', 'Reis', 'Araújo', 'Monteiro', 'Moraes', 'Nascimento', 'Ramos',
    'Campos', 'Teixeira', 'Cardoso', 'Duarte', 'Cavalcanti', 'Freitas', 'Mendes', 'Pinto',
    'Machado', 'Correia', 'Dias', 'Lopes', 'Moreira', 'Castro', 'Batista', 'Fernandes',
    'Vieira', 'Nunes', 'Farias', 'Barros', 'Cunha', 'Cruz', 'Nogueira', 'Machado'
  ]
  
  // Selecionar aleatoriamente um nome e um sobrenome
  const nome = nomes[Math.floor(Math.random() * nomes.length)]
  const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)]
  
  return `${nome} ${sobrenome}`
}



















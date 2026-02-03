# Corrigir ERR_TOO_MANY_REDIRECTS com Cloudflare + Railway

Quando **www.plenipay.com** ou **plenipay.com** dá "redirecionado muitas vezes", quase sempre é configuração do **Cloudflare** ou conflito entre Cloudflare e a aplicação.

## 1. Ajuste o SSL/TLS no Cloudflare (principal causa)

Com **SSL/TLS = Flexible**, o Cloudflare fala **HTTPS** com o visitante e **HTTP** com o Railway. Se a aplicação ou algum header mandar "use HTTPS", o navegador entra em loop.

**O que fazer:**

1. No **Cloudflare** → domínio **plenipay.com** → **SSL/TLS**.
2. Em **Overview**, em "Your SSL/TLS encryption mode":
   - Troque de **Flexible** para **Full** ou **Full (strict)**.
3. Salve.

Assim o tráfego entre Cloudflare e Railway passa a ser HTTPS e o loop por causa de HTTP→HTTPS tende a sumir.

---

## 2. Evite regras de redirect conflitantes

Se você tiver, por exemplo:

- "Se for **plenipay.com** → redirecionar para **https://www.plenipay.com**"
- e outra: "Se for **www.plenipay.com** → redirecionar para **https://plenipay.com**"

isso gera loop.

**O que fazer:**

1. **Cloudflare** → **Rules** → **Redirect Rules** (e **Page Rules**, se ainda usar).
2. Escolha **um** domínio canônico:
   - ou sempre **https://www.plenipay.com**, ou sempre **https://plenipay.com**.
3. Deixe **apenas uma** regra de redirect para esse canônico (ex.: `plenipay.com` → `https://www.plenipay.com`).
4. Remova qualquer regra que mande **www** de volta para **não-www** (ou o contrário).

---

## 3. Resumo rápido

| Onde | O que conferir |
|------|----------------|
| **SSL/TLS** | Modo **Full** ou **Full (strict)** (não Flexible). |
| **Redirect Rules** | Só uma regra de canonical (www ou não-www), sem ida e volta. |
| **Page Rules** | Nenhuma regra fazendo redirect entre www ↔ não-www. |

Depois de alterar, espere 1–2 minutos, limpe o cache do site no Cloudflare (Caching → Purge Everything, se quiser) e teste em aba anônima ou outro navegador.

---

## 4. O que já foi ajustado no código

- O **middleware** da aplicação foi ajustado para aceitar tanto **plenipay.com** / **www.plenipay.com** quanto o host do **Railway** (`.railway.app`), para não criar redirect desnecessário quando a requisição chega pelo proxy.
- A aplicação **não** faz redirect automático de www ↔ não-www; isso deve ficar só no Cloudflare, com uma única regra.

Se depois disso o erro continuar, vale checar no Cloudflare **Rules** e **SSL/TLS** se não há outra regra ou configuração que force um segundo redirect.

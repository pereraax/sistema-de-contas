# Como editar o visual do app (estilo “Canva” – um lugar só)

O visual do **app** (modo app / Capacitor) é controlado por **variáveis CSS** em um único lugar. Assim você muda cores, bordas e efeitos sem mexer no site e sem precisar caçar em vários arquivos.

---

## Onde editar

Abra o arquivo **`app/globals.css`** e procure a seção:

```text
========== TEMA DO APP (edite aqui para mudar o visual do app sem afetar o site) ==========
```

Tudo que está dentro de **`body.platform-app`** vale **só para o app**; o site no navegador não é afetado.

---

## Variáveis que você pode mudar

| Variável | O que controla | Exemplo de valor |
|----------|----------------|-------------------|
| `--app-bg` | Fundo geral do app (claro) | `#f0f4f8` |
| `--app-bg-dark` | Fundo no modo escuro | `#111827` |
| `--app-surface` | Fundo de cards e barra inferior (claro) | `#ffffff` |
| `--app-surface-dark` | Superfícies no modo escuro | `#1f2937` |
| `--app-primary` | Cor principal (botões, destaques) | `#007A99` |
| `--app-primary-light` | Cor principal mais clara | `#00C2FF` |
| `--app-text` | Texto principal (claro) | `#0D1B2A` |
| `--app-text-muted` | Texto secundário (claro) | `#64748b` |
| `--app-text-dark` | Texto no modo escuro | `#f9fafb` |
| `--app-text-muted-dark` | Texto secundário no escuro | `#9ca3af` |
| `--app-radius` | Arredondamento de cards (px) | `16px` |
| `--app-radius-sm` | Arredondamento menor | `10px` |
| `--app-shadow` | Sombra suave de cards | `0 4px 20px rgba(0,0,0,0.06)` |
| `--app-shadow-lg` | Sombra mais forte | `0 10px 40px rgba(0,0,0,0.08)` |
| `--app-transition` | Duração das animações | `0.25s ease` |

Troque os valores e salve; no próximo build/deploy o app já usa o novo tema.

---

## Exemplos rápidos

**Deixar o app mais escuro (claro):**
```css
--app-bg: #e2e8f0;
--app-surface: #f8fafc;
```

**Cores mais fortes:**
```css
--app-primary: #0ea5e9;
--app-primary-light: #38bdf8;
```

**Cards mais redondos:**
```css
--app-radius: 24px;
--app-radius-sm: 14px;
```

**Sombras mais marcadas:**
```css
--app-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
--app-shadow-lg: 0 20px 50px rgba(0, 0, 0, 0.15);
```

---

## Efeitos extras (opcional)

Na mesma seção você pode adicionar mais regras dentro de `body.platform-app` para:

- Bordas em cards
- Hover/active em botões
- Blur na barra inferior (já tem um `backdrop-filter` leve)

Exemplo para borda sutil nos cards:

```css
body.platform-app .app-shell .rounded-2xl {
  border: 1px solid rgba(0, 0, 0, 0.06);
}
```

Assim você mantém o app **clean e moderno** e edita tudo em um lugar só, sem alterar o site.

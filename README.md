# Minuto Sagrado

Quiz bíblico interativo com diversos modos de jogo (Quiz Diário, Modo Personagens, Verdadeiro ou Falso, Desafio Teológico, Modo Kids, Conexões, Enigma, Escolhas Difíceis e Jornada Cronológica).

## Como rodar

O projeto é 100% estático (HTML/CSS/JS), sem dependências de backend ou build.



## Estrutura do projeto

```
index.html        # markup da aplicação (produção)
assets/           # imagens usadas pela aplicação
css/
  style.min.css   # estilos minificados (produção)
js/
  script.min.js   # banco de dados + lógica do jogo, minificados (produção)
src/              # arquivos-fonte legíveis, para desenvolvimento
  style.css
  data.js
  script.js

```

## Desenvolvimento

Edite os arquivos em `src/`. Depois, gere os artefatos de produção:

```bash
npx clean-css-cli -o css/style.min.css src/style.css
cat src/data.js src/script.js > /tmp/combined.js
npx terser /tmp/combined.js --compress --mangle -o js/script.min.js
```
Copyright (c) 2026 [André Luiz de Oliveira]. Todos os direitos reservados.

Este código é de propriedade privada e não é permitido o uso, cópia, modificação ou distribuição sem autorização expressa do autor.


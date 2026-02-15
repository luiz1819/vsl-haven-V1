# Teste de Formatos de URL do Bunny.net

## Resultados dos Testes

### ✅ TEST 1: iframe Embed URL

**URL**:
`https://iframe.mediadelivery.net/embed/589969/1cb92abc-fe8e-4e1d-ad6d-2707145715bc`

- **Status**: 200 OK
- **Resultado**: ✅ SUCCESS! Contains player: true
- **Uso**: Player iframe completo do Bunny

### ✅ TEST 2: Direct Play URL

**URL**:
`https://iframe.mediadelivery.net/play/589969/1cb92abc-fe8e-4e1d-ad6d-2707145715bc`

- **Status**: 200 OK
- **Resultado**: ✅ SUCCESS! Contains player: true
- **Uso**: Player direto sem wrapper de embed

### ❌ TEST 3: HLS com bcdn_token no PATH

**URL**:
`https://vz-2730fbe3-f6b.b-cdn.net/bcdn_token=XXX&expires=YYY&token_path=/VIDEO_ID//VIDEO_ID/playlist.m3u8`

- **Status**: 403 Forbidden
- **Resultado**: ❌ FAILED
- **Motivo**: Nosso token não funciona neste formato (precisa ser gerado
  diferente)

### ✅ TEST 4: HLS com token como query parameter

**URL**:
`https://vz-2730fbe3-f6b.b-cdn.net/1cb92abc-fe8e-4e1d-ad6d-2707145715bc/playlist.m3u8?token=XXX&expires=YYY`

- **Status**: 200 OK
- **Resultado**: ✅ SUCCESS! Manifest retrieved
- **Uso**: Nossa implementação atual (FUNCIONA!)

## Conclusões

### ✅ Funcionam Perfeitamente:

1. **iframe Embed** - Mais simples, player do Bunny
2. **Direct Play** - Player do Bunny sem wrapper
3. **HLS com query params** - Nossa implementação atual (controle total)

### ❌ Não Funciona:

- **bcdn_token no path** - Requer método diferente de geração de token que o
  Bunny usa internamente

## Recomendação

**Manter nossa implementação atual (TEST 4)** porque:

- ✅ Já está funcionando (200 OK confirmado)
- ✅ Permite usar players HLS customizados (hls.js, video.js)
- ✅ Controle total sobre UI/UX do player
- ✅ Suporta adaptive bitrate streaming

**Alternativa para casos simples**: Usar iframe embed (TEST 1) quando não
precisar de customização.

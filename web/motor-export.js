/* =====================================================================
   Exportação dos módulos do motor para uso no navegador.
   Executado no fim do bundle gerado por scripts/build-pagina.js.
   ===================================================================== */
const segmentos = require('./segmentos');
const promptEngine = require('./prompt-engine');
const pacote = require('./pacote');
const zip = require('./zip');
const utils = require('./utils');

globalThis.MagicPromptMotor = {
  versao: promptEngine.VERSAO,

  // modelos e catálogos
  MODELOS: segmentos.MODELOS,
  OBJETIVOS: segmentos.OBJETIVOS,
  ESTILOS_DESEJADOS: segmentos.ESTILOS_DESEJADOS,
  IDIOMAS: segmentos.IDIOMAS,
  listarModelos: segmentos.listarModelos,
  getModelo: segmentos.getModelo,
  sugestoesDoModelo: segmentos.sugestoesDoModelo,

  // geração
  gerarPrompt: promptEngine.gerarPrompt,
  gerarPromptResumo: promptEngine.gerarPromptResumo,
  validarDados: promptEngine.validarDados,
  paginasAtivas: promptEngine.paginasAtivas,
  gerarArquivosDeApoio: pacote.gerarArquivosDeApoio,
  resumoPasta: pacote.resumoPasta,

  // empacotamento e utilidades
  ZipWriter: zip.ZipWriter,
  Buffer: globalThis.Buffer,
  utils,
};

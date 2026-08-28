from pathlib import Path
import re

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader


ROOT = Path(r"C:\Users\reido\OneDrive\Documentos\ChatGPT\Projeto Riddy - Locadora de Veículos")
SOURCE = Path(r"C:\Users\reido\Downloads\Beny 2 Guns DC EV Small Charging Station-自研1107 (2) (1).pdf")
RENDER_DIR = ROOT / "tmp" / "pdfs" / "source_render"
OUTPUT = ROOT / "output" / "pdf" / "Manual_BENY_2_Conectores_DC_PT-BR.pdf"


PAGES = [
"""MANUAL TÉCNICO DO USUÁRIO
Estação compacta de recarga CC para veículos elétricos com 2 conectores

Zhejiang Benyi New Energy Co., Ltd.
Zona Industrial de Shuanghuanglou, Beibaixiang, Yueqing, Zhejiang, República Popular da China
Site: www.evb.com | E-mail: info@evb.com
Versão: 20260305-01
Endereço: xxxxxxxx | Importador: xxxxxxx

Os códigos QR, marcas, fotografias e demais elementos gráficos foram mantidos conforme o documento original.""",

"""SUMÁRIO

Prefácio

1. Visão geral
1.1 Apresentação do produto - 02
1.2 Diagrama conceitual do produto - 02
1.3 Parâmetros principais - 03
1.4 Desempenho e características do produto - 04
1.5 Visão geral das funções da estação de recarga - 04
1.6 Ambiente de utilização do produto - 06
1.7 Especificações de projeto do produto - 06

2. Instalação
2.1 Descrição de segurança - 06
2.2 Condições de instalação - 07
2.3 Movimentação das caixas de embalagem - 07
2.4 Desembalagem - 08
2.5 Movimentação da estação de recarga - 09
2.6 Requisitos para execução da base de concreto - 10
2.7 Instalação da estação de recarga - 11
2.8 Entrada dos cabos - 11
2.9 Opções de rede - 12
2.10 Plataforma OCPP e conexão de rede - 13
2.11 Aceitação da instalação - 16

3. Instruções de operação e precauções - 16
3.1 Verificação de segurança antes do uso - 16
3.2 Precauções operacionais - 16
3.3 Seleção do idioma - 17
3.4 Descrição do estado de recarga - 18
3.5 Descrição das luzes indicadoras - 21
3.6 Uso do botão de parada de emergência - 21
3.7 Software do computador host do sistema de recarga - 21

4. Embalagem, transporte e armazenamento - 22

5. Instruções para pedido e serviço pós-venda - 23
5.1 Instruções para pedido - 23
5.2 Serviço pós-venda - 23
5.3 Lista de acessórios - 23
5.4 Placa de identificação - 23

Apêndice I - Lista de solução de problemas
Apêndice II - Diagrama elétrico esquemático
Apêndice III - Guia de manutenção do equipamento de recarga
Apêndice IV - Cartão de garantia do produto""",

"""PREFÁCIO

Antes de qualquer operação, leia este manual para conhecer a forma correta de utilizar o equipamento. Guarde-o para futuras consultas.

A BENY New Energy, isto é, Zhejiang Benyi New Energy Co., Ltd., é uma marca líder que produz anualmente milhares de dispositivos de proteção CC e estações de recarga de alta qualidade para sistemas fotovoltaicos, armazenamento de energia e recarga de veículos elétricos. A estação combina design, facilidade de operação, confiabilidade e robustez. Há modelos de parede, gabinetes verticais e soluções divididas, com potência de saída de 20 kW a 600 kW. Os produtos possuem certificações UL, CE, CB, RCM, UKCA, CCC e RoHS, além de balanceamento dinâmico de carga e detecção de falha PEN.

PRECAUÇÕES DE SEGURANÇA
- Não coloque materiais inflamáveis, explosivos ou combustíveis, produtos químicos, vapores combustíveis ou outros materiais perigosos perto da estação.
- Mantenha o conector limpo e seco. Em caso de sujeira, use pano limpo e seco. Não toque nos contatos do conector quando estiver energizado.
- É proibido usar a estação se o conector ou cabo estiver defeituoso, rachado, desgastado, rompido ou com condutores expostos. Contate a assistência.
- Não desmonte, repare nem modifique o equipamento sem qualificação profissional. Para reparos ou alterações, contate a equipe responsável.
- Leia e siga as regras de uso. Operação incorreta pode causar danos, infiltração de água ou fuga de corrente.
- É proibido retirar o conector durante a recarga.
- Em qualquer anormalidade, pressione imediatamente o botão de parada de emergência para interromper as correntes de entrada e saída.
- Em chuva intensa ou trovoadas, recarregue com cautela. Crianças não devem se aproximar nem utilizar o equipamento.
- Mantenha as portas dos dois lados fechadas durante a operação para evitar choque elétrico.
- O veículo deve permanecer parado durante a recarga. Desligue veículos híbridos antes de recarregar.
- Problemas causados por operação irregular não são cobertos pela garantia.
- Descarte resíduos conforme a legislação local.
- Pressione mensalmente o botão de teste do dispositivo de proteção contra fuga de corrente.
- A cada três meses, verifique se há parafusos internos soltos.

ATENÇÃO - Este equipamento possui tensões perigosas na entrada e na saída, capazes de causar morte. Siga rigorosamente as sinalizações e instruções. Pessoas não autorizadas não devem remover a cobertura externa.

1. VISÃO GERAL
1.1 Apresentação do produto
Esta estação CC integrada destina-se à recarga rápida de veículos elétricos. Reúne conversão de potência, controle de recarga, interação homem-máquina, comunicação, cobrança e medição. Inclui tela sensível ao toque, leitor de cartão, medidor de energia, módulos de potência e comunicação, interfaces de recarga, controle e gabinete. São opcionais: aquecimento do gabinete, alarme de fumaça, sistema de extinção e alarme de inundação. Possui proteção IP55, proteções de entrada e saída, monitoramento do cabo e interrupção automática em falhas. Oferece CAN, Ethernet e RS485 para integração ao centro de gestão. A arquitetura modular permite configurações de 60 a 90 kW e 120 kW.

Figura 1 - Vista externa da estação.

1.2 Diagrama conceitual do produto
Rede trifásica; contator CA; módulo retificador; contatores CC; unidade de monitoramento (placa principal e placa de monitoramento); leitor de cartão RFID; medidor trifásico; amostragem de entrada; amostragem de saída.""",

"""1.3 PARÂMETROS PRINCIPAIS

Tensão nominal de entrada CA: 380-415 Vca, 3P+N+PE
Frequência da alimentação CA: 50/60 Hz
Fator de potência de entrada: >= 0,99 com 100% de carga
Faixa de regulação da tensão CC: 150 a 1.000 V
Precisão de corrente: <= +/-1%
Precisão da regulação de tensão: <= +/-0,5% (150 a 1.000 V; 0 a 20 MHz)
Precisão em corrente constante: <= +/-0,5% (carga de 20% a 100% da faixa nominal)
Consumo em espera: <= 0,1% da potência nominal de saída
Corrente de impulso de entrada: <= 110% da corrente nominal de entrada
Sobretensão transitória de saída: <= 110% da tensão de saída em regime permanente
Desequilíbrio da equalização de corrente: <= 5% da corrente nominal de saída
Limite de corrente harmônica (THD): <= 5%, equipamento Classe A
Eficiência: >= 95%
Ruído: <= 69 dB
Imunidade a oscilação: nível 4
Imunidade a descarga eletrostática: nível 4
Imunidade a campo eletromagnético de RF: nível 3
Imunidade a transientes elétricos rápidos: nível 3
Imunidade a surtos: nível 3
Imunidade a perturbações conduzidas induzidas por RF: nível 3
Imunidade a campo na frequência da rede: nível 3
Imunidade a campo oscilatório amortecido: nível 3 (1 MHz e 100 kHz)

Funções de comunicação
Frequência LTE-FDD: B1/B2/B3/B4/B5/B7/B8/B12/B13/B18/B19/B20/B25/B26/B28
Frequência LTE-TDD: B38/B39/B40/B41
Frequência UMTS/WCDMA: B1/B2/B4/B5/B6/B8/B19
Frequência MIFARE: 13,56 MHz +/- 7 kHz
Wi-Fi 2,4 GHz: 2.412 a 2.484 MHz
Potência máxima de transmissão Wi-Fi: 20,5 dBm
WCDMA: 24 dBm (+1/-3 dB)
LTE-FDD e LTE-TDD: 23 dBm +/- 2 dB
MIFARE: 14,05 dBuA/m

1.4 DESEMPENHO E CARACTERÍSTICAS
- Alta eficiência, baixo conteúdo harmônico e qualidade Classe A. Eficiência do sistema >=95%, alta densidade de potência e baixo consumo. Correção ativa do fator de potência, interferência harmônica <=5% e fator de potência até 0,98.
- Projeto modular e confiável, com múltiplos módulos em paralelo. A falha de um módulo não interrompe o sistema.
- Proteção abrangente: autodiagnóstico de entrada, saída e componentes; proteção contra subtensão/sobretensão, curto-circuito, sobretemperatura, falha de módulo e isolamento; verificação das conexões de recarga e da bateria.
- Ampla faixa de tensão de saída e potência constante, com controle inteligente e ajuste para veículos de diferentes níveis de tensão.

1.5 VISÃO GERAL DAS FUNÇÕES
1.5.1 Interface homem-máquina
Controlador central industrial embarcado de 32 bits; medidor multifuncional CC nível 1.0; leitor de cartão sem contato ISO 14443-A/B com autenticação criptografada; tela LCD sensível ao toque de 7 polegadas, legível em alta luminosidade e operável até -30 °C; detecção de desprendimento do conector; comunicação em tempo real por 4G, Ethernet, Wi-Fi e CAN; atualização local ou remota; ajuste dinâmico da recarga conforme os dados do sistema de gerenciamento da bateria.""",

"""1.5.1 INTERFACE HOMEM-MÁQUINA - FUNÇÕES DE SAÍDA
- Exibe em tempo real tensão e corrente de recarga, estado de carga (SOC), tempo, medição de energia, dados da bateria e outras informações.
- Exibe informações correspondentes quando ocorre uma falha.
- Exibe informações de cada estado da estação.
- Exibe informações adicionais fornecidas pela unidade de monitoramento.
- Exibe informações da bateria do veículo elétrico.

1.5.2 Autoteste
Ao ser energizada, a estação executa autoteste do gabinete, relógio, fonte de alimentação, espaço de armazenamento e outros itens. Falhas são mostradas pelo indicador de estado ou na tela e registradas.

1.5.3 Atualização de software
Estações com sistema mestre de monitoramento aceitam OTA e USB-OTA. Sem sistema mestre, aceitam apenas USB-OTA.

1.5.4 Funções de software
Transmissão: a interface reservada coleta e envia dados de utilização, recarga e falhas.
Armazenamento: transações são gravadas em memória não volátil. Os dados devem permanecer corretos, contínuos, completos e válidos. Deve haver espaço para pelo menos 10.000 registros e coleta em tempo hábil.

1.5.5 Funções de controle
A unidade de monitoramento adapta-se aos modos de operação e executa corretamente a sequência: corrente constante com tensão limitada -> tensão constante -> término da recarga.

1.5.6 Função de alarme
Em condições como saída CC anormal, alarme/falha do módulo de potência, sobretensão/subtensão/sobrecorrente na saída, disparo de chave ou fusível na entrada, interrupção de comunicação ou falha da unidade de monitoramento, o sistema emite alarme sonoro e visual e mostra a ocorrência na tela.

1.5.7 Registro de eventos
Falhas e horários de início/fim da recarga são registrados e preservados mesmo sem energia.

1.5.8 Sincronização de tempo
A estação aceita comandos de sincronização do terminal de monitoramento, atendendo a PPS (pulso por segundo) e PPM (subpulso).

1.6 AMBIENTE DE UTILIZAÇÃO
- Altitude até 2.000 m; acima disso, aplicar redução de capacidade.
- Consulte a placa para a temperatura ambiente. Acima de 55 °C, aplicar redução de capacidade.
- Umidade relativa <=95% UR, sem condensação.
- Em uso externo, instalar proteção contra sol e chuva.
- Inclinação de instalação máxima de 5%.
- Manter materiais inflamáveis e explosivos afastados.
- Pressão atmosférica: 79 a 106 kPa.
- Manter boa circulação de ar ao redor do gabinete.

1.7 ESPECIFICAÇÕES DE PROJETO
China: GB/T 18487.1-2023; GB/T 18487.2-2017; GB/T 18487.3-2001.
União Europeia: EN IEC 61851-1:2019; EN 61851-23:2014; EN 61851-24:2014; EN IEC 61851-21-2:2021; IEC 61851-1:2017; IEC 61851-23:2014; IEC 61851-24:2014; EN IEC 61000-6-2:2019; EN IEC 61000-6-4:2019.

2. INSTALAÇÃO
2.1 Segurança
Leia e siga todas as instruções antes de instalar, manter ou utilizar a estação. A instalação deve atender às normas e aos regulamentos locais.

2.1.2 Risco de choque elétrico
- Desligue a alimentação antes da instalação ou manutenção e mantenha-a desligada até que o equipamento esteja completamente montado e fechado.
- Em perigo ou acidente, um eletricista qualificado deve desconectar imediatamente a alimentação.
- Não opere a estação danificada ou com cabo excessivamente gasto. Contate a assistência ou o revendedor.
- Não lave com água pressurizada, não use com as mãos molhadas e não mergulhe o conector em líquidos.
- Não introduza dedos ou objetos na porta ou no conector de recarga.
- Antes de recarregar, leia as instruções da estação e do veículo.""",

"""2.1.3 ALERTA SOBRE ACÚMULO DE GASES
Alguns veículos podem liberar gases tóxicos ou explosivos durante recarga em ambiente interno e exigir ventilação externa. Consulte o manual do veículo.

2.2 CONDIÇÕES DE INSTALAÇÃO
- Calcule as cargas elétricas existentes para determinar a corrente máxima de operação.
- Calcule a distância entre o quadro elétrico e a estação para limitar a queda de tensão, conforme a regulamentação local.
- Obtenha as licenças necessárias e programe uma inspeção por eletricista após a instalação.
- O condutor de proteção PE não deve conter emendas.
- Dimensione os condutores conforme regulamentação local, corrente máxima e queda de tensão.
- Use ferramentas corretas, materiais adequados e medidas de proteção.
- Verifique se o local possui boa recepção de telefonia celular.
- Instale corretamente os cabos de potência e de dados.
- Como a ventilação da estação fica na traseira, mantenha espaço livre e ventilado atrás do equipamento.
- Em ambiente interno, a ventilação deve superar 3.000 m³/h.

2.3 MOVIMENTAÇÃO DAS CAIXAS
(1) Use empilhadeira para movimentar os produtos embalados. Dimensões indicadas: 800 x 800 x 800.

2.4 DESEMBALAGEM
(1) Retire as duas laterais e o painel traseiro.
(2) Retire o painel frontal.
(3) Retire a tampa da caixa de madeira.""",

"""2.5 MOVIMENTAÇÃO DA ESTAÇÃO DE RECARGA

2.5.1 Com empilhadeira
As estações podem ser transportadas com empilhadeira.

2.5.2 Com guindaste
O equipamento pode ser içado. Há quatro furos superiores reservados para olhais.
(1) Aperte os quatro olhais de içamento.
(2) Instale os ganchos e as cintas.

2.6 REQUISITOS PARA A BASE DE CONCRETO

2.6.1 Condições
- A fundação deve atender às normas locais.
- As características do concreto devem ser calculadas com base nos dados técnicos da estação.
- O concreto deve ser adequado às condições de inverno.
- Calcule a espessura da base e escolha o local conforme o peso do conjunto.
- A fundação deve estar nivelada. Inclinações laterais ou longitudinais podem provocar infiltração e danos.
- A fundação deve ter parte enterrada e a estação deve ser instalada sobre o solo.

2.6.2 Desenho construtivo da base
(1) O concreto deve ter classe mínima C20. Parte subterrânea: 40 cm; parte acima do solo: 20 cm. Dimensões: 800 x 700 x 400 mm. A superfície deve estar completa, plana e sem trincas. O contorno inferior do equipamento é de 600 x 500 mm; após a instalação, deve haver 100 mm entre cada borda do equipamento e a borda da fundação.
(2) A tubulação embutida deve coincidir com a abertura da placa inferior da estação, evitando incompatibilidade que impeça a execução.""",

"""2.7 INSTALAÇÃO DA ESTAÇÃO
(3) Fixe com peças embutidas de diâmetro 12 mm ou chumbadores de expansão em aço inoxidável ou galvanizado a quente. Alinhe os furos da estação com os da base e aperte com parafusos de expansão M12.

2.8 ENTRADA DOS CABOS
O sistema de condutores ativos é trifásico a quatro fios. O aterramento da distribuição de baixa tensão pode ser TT ou TN; recomendam-se TN-S ou TN-C-S.

Conecte o cabo trifásico embutido na base à entrada da estação, observando os cinco condutores e suas cores. Ligue o PE à barra de terra do gabinete. Após a ligação, vede a entrada dos cabos com massa corta-fogo.

Entrada CA: cinco condutores L1/L2/L3/N/PE, da esquerda para a direita (amarelo-verde, marrom, preto, cinza e azul).

Tabela de cabos recomendados
- BMDC60-S: YJV 3 x 35 mm² + 2 x 16 mm²; cobre vermelho; terminais DT-35/DT-16.
- BMDC90-S: YJV 3 x 50 mm² + 2 x 25 mm²; cobre vermelho; terminais DT-50/DT-25.
- BMDC120-S: YJV 3 x 70 mm² + 2 x 35 mm²; cobre vermelho; terminais DT-70/DT-35.
- Modelos BMDC60-D, BMDC90-D e BMDC120-D: consulte a configuração correspondente.
Referência: GB/T 12706.1 (IEC 60502-1). Para o local, siga a IEC 60364 e a legislação aplicável.

Requisitos de aterramento
1. Local: canto inferior esquerdo da lateral do equipamento.
2. Resistência: normalmente não deve exceder 4 ohms e deve permanecer dentro do limite durante toda a vida útil.
3. Método: hastes metálicas devem ser enterradas pelo menos 1,5 m. Ajuste a profundidade às condições do solo e do clima.
4. Escolha do ponto: próximo à estação; longe de ruído industrial e fontes de interferência; evite obstáculos como pavimento de concreto que aumentem a impedância.
5. Cabo de aterramento: seção mínima de 25 mm².

2.9 OPÇÕES DE REDE
- Ethernet: LAN/OCPP, interface RJ45 e cabo Cat5e, comprimento máximo de 30 m.
- 3G/4G: cartão SIM.
- Wi-Fi: 2,4 GHz.
Elementos do desenho: terra; 1,5 m; barra de aterramento interna; PE proveniente da rede; barra de terra; aterramento externo.""",

"""2.10 CONEXÃO À PLATAFORMA OCPP

2.10.1 Informações necessárias antes da operação
- Endereço do servidor OCPP.
- Endereço remoto e porta.

2.10.2 Conectividade de rede
(1) Com a estação em espera, pressione o botão de parada de emergência na lateral do gabinete.
(2) Toque cinco vezes em qualquer ícone de conector. Ao ouvir dois bipes, aguarde a tela de login.
(3) Digite a senha. A senha padrão é 12345678.
(4) Configure a rede, selecione o modo necessário e toque na seta inferior direita para avançar.

Modos disponíveis
- Modo off-line: recarga local, sem faturamento ou liquidação.
- Wi-Fi: conexão à rede sem fio para faturamento e liquidação on-line.
- Comutação automática: com dois ou mais modos configurados, alterna automaticamente conforme o estado da rede.
- LTE: faturamento e liquidação pela rede 3G/4G.
- Ethernet: conexão à rede cabeada para faturamento e liquidação.
- IP estático: define endereço fixo; o equipamento deixa de obter o endereço automaticamente.

(5) Configure o Wi-Fi, informando nome da rede e senha.
(6) Configure o APN LTE e, se exigido, informe os dados de autorização. Caso contrário, avance.""",

"""2.10 CONEXÃO OCPP - CONTINUAÇÃO
(7) Para IP estático, informe endereço IP, gateway e máscara de sub-rede.
(8) Para OCPP, informe o endereço URL.
(9) Toque na seta inferior direita para concluir e libere imediatamente o botão de parada de emergência.

2.11 ACEITAÇÃO DA INSTALAÇÃO
1. Verifique visualmente se o gabinete está plano e sem amassados, riscos, deformações ou outros defeitos; o revestimento deve ser uniforme e sem descascamento; as peças devem estar firmes, sem corrosão, rebarbas ou trincas.
2. A obra civil e a instalação elétrica devem atender aos desenhos e às instruções.
3. A estação deve estar firmemente instalada. Todos os chumbadores devem estar travados com torque mínimo de 12,4 N.m. Reserve espaço para manutenção e instale a uma altura adequada à interação do usuário.
4. Cabos de alimentação devem ter modelos e especificações corretos, ser organizados, bem fixados e identificados, com folga adequada nos pontos de conexão.
5. Antes de energizar, confira o aterramento. A resistência não deve exceder 4 ohms.
6. Verifique se a vala de cabos está vedada com massa corta-fogo.

3. OPERAÇÃO E PRECAUÇÕES

3.1 Verificação antes do uso
- Confirme que o produto não apresenta riscos, ferrugem ou deformação.
- Verifique a segurança da alimentação e a ausência de corpos estranhos no conector da estação e na tomada do veículo.
- Não use cabo ou conector com carcaça danificada ou condutores expostos.
- Mantenha o conector seco. Com o equipamento totalmente desenergizado, remova água com pano limpo e seco.

3.2 Precauções operacionais
- Se a tela indicar falha, não recarregue e contate a assistência.
- Ao usar cartão IC, verifique se o saldo é suficiente; caso contrário, a sessão será encerrada automaticamente.
- Com duas interfaces em uso, identifique corretamente usuário A ou B e siga as instruções da tela.
- Siga os avisos do equipamento e não aplique força excessiva ao conectar ou retirar o conector.
- Aguarde o bipe de confirmação na leitura do cartão; a retirada antecipada pode causar falha.
- Quando o conector estiver inserido e a luz verde acesa, ele está energizado. Não o retire para evitar choque.
- Em emergência, pressione a parada de emergência; uma recarga em andamento será interrompida imediatamente.
- Verifique regularmente o pino ou a janela indicadora do protetor contra surtos. Se o pino se projetar ou a janela ficar vermelha, substitua o protetor imediatamente.""",

"""3.3 SELEÇÃO DO IDIOMA
(1) Toque no ícone LANG no canto superior esquerdo para abrir a seleção de idioma.
(2) Toque na bandeira do idioma desejado. É possível selecionar dois idiomas para exibição.

3.4 DESCRIÇÃO DO ESTADO DE RECARGA
(1) Insira o conector em espera na porta de recarga do veículo. Há quatro métodos: cartão, MAC, código QR e terminal POS (se instalado). Escolha o pagamento e faça a verificação.
(2) Para cartão, aproxime-o da área de leitura e aguarde a validação.
(3) Para POS, siga as instruções do terminal.

Figura 3 - Protetor contra surtos CA: janela indicadora verde = normal; vermelha = danificado.""",

"""3.4 ESTADO DE RECARGA - CONTINUAÇÃO
(4) Verificação concluída; a recarga está sendo iniciada. Aguarde o equipamento.
(5) Durante a recarga, a tela mostra estado, tempo, corrente e tensão de saída, potência, energia fornecida e corrente/tensão solicitadas pelo veículo.
(6) Toque em STOP no canto inferior direito para iniciar a verificação de encerramento.
(7) Aproxime o cartão da área de leitura, confirme o término e realize o acerto da sessão.
(8) A recarga está sendo encerrada.
(9) Recarga concluída. Recoloque o conector em seu suporte.""",

"""3.5 LUZES INDICADORAS
Há dez estados de indicação:
- Espera normal: luz verde acesa.
- Conector inserido no veículo: luz verde piscando.
- Recarga em andamento: luz verde em movimento.
- Recarga pausada: centro da luz verde aceso e laterais reduzidas, ou luz amarela movendo-se da esquerda para a direita.
- Bateria totalmente carregada: laterais verdes acesas e centro reduzido, ou luz amarela da direita para a esquerda.
- Recarga concluída: luz verde ou amarela acesa.
- Recarga reservada: luz verde ou amarela piscando.
- Estação indisponível: luz vermelha piscando.
- Falha da estação: luz vermelha acesa.
- Painel de luzes off-line: vermelho ou amarelo piscando da esquerda para a direita.

3.6 BOTÃO DE PARADA DE EMERGÊNCIA
- Em fuga de corrente, incêndio, choque elétrico ou outra anormalidade, pressione imediatamente o botão.
- Também pressione se a estação falhar, não for possível interromper a recarga ou houver curto-circuito interno.
- Se pressionado fora de uma sessão, a luz de falha acende e a tela LCD pode entrar na configuração.
- Após eliminar a emergência, libere o botão; caso contrário, não será possível continuar a recarga.

3.7 SOFTWARE DO COMPUTADOR HOST
O software é fornecido quando há necessidade especial. Não altere livremente a configuração da estação. Problemas causados por alterações não autorizadas são de responsabilidade do cliente. Consulte a documentação técnica do software.

A conexão entre o computador host e a placa principal fica na área J8, terminais RS485-4-A e RS485-4-B; o ponto de ligação é o terminal XT11.

4. EMBALAGEM, TRANSPORTE E ARMAZENAMENTO
Embalagem: gabinete envolvido com filme protetor, sustentado por espuma e acondicionado em caixa de madeira.
Transporte: evite choques violentos, impactos e inversão do produto.
Armazenamento: mantenha em local interno, seco e ventilado, sem virar de cabeça para baixo.
Símbolos: não empilhar; este lado para cima; frágil; manusear com cuidado; manter longe da chuva; não rolar.""",

"""5. INSTRUÇÕES PARA PEDIDO E PÓS-VENDA

5.1 Pedido
- Conheça a aplicação e o cenário e preencha o formulário de necessidades do cliente.
- Informe nome, modelo, especificações, parâmetros e configuração desejada.
- Para ambiente ou requisitos técnicos especiais, negocie com a equipe técnica da fábrica e formalize um acordo.

5.2 Serviço pós-venda
Nas condições corretas de guarda, instalação, uso e operação, o prazo de garantia é o definido no contrato comercial. Se houver dano ou impossibilidade de uso normal por falha de fabricação, a unidade produtora efetuará gratuitamente reparo, ajuste ou substituição de peças.

5.3 LISTA DE ACESSÓRIOS
Acessórios: 5 parafusos de expansão para instalação, 1 cabo conversor USB e 4 cartões IC.
Documentos: manual de instruções, certificado de conformidade, cartão de garantia e relatório de inspeção de fábrica.

5.4 PLACA DE IDENTIFICAÇÃO
Campos: instruções; tensão de entrada; temperatura de operação; corrente nominal de entrada; grau de proteção; classe de proteção; número de série; data; tipo de conector; frequência nominal; potência nominal; tensão de saída; corrente máxima de saída.

APÊNDICE I - TABELA DE FALHAS (códigos 0 a 15)
0 Adesão do contator CA de entrada. Reinicie e verifique; se persistir, inspecione e substitua/repare o contator.
1 Falha do contator CA de entrada. Inspecionar.
2 Adesão do contator de saída. Inspecionar.
3 Falha do contator de saída. Inspecionar.
4 Adesão do contator paralelo. Inspecionar.
5 Falha do contator paralelo. Inspecionar.
6 Sobrecorrente CC. Reiniciar a recarga.
7 Bateria invertida. Reinserir o conector; se necessário, reparar.
8 Falha do fusível. Verifique e substitua o fusível.
9 Ação incorreta ou recusa do contator de entrada CA. Inspecionar.
10 Falha de contato K1/K2. Inspecionar.
11 A recarga para após 10 minutos no pacote BSM. Reiniciar.
12 Medidor CC off-line. Reenergize; verifique cabos e o medidor; substitua se necessário.
13 SECC CAN off-line. Verifique fiação e indicador; reenergize; se persistir, substitua o SECC CAN.
14 Subtensão/alarme/sobretensão do monitor de isolamento. Reinicie; após tentativas sem sucesso, reparar.
15 Falha de execução CA/CC do monitor de isolamento. Substitua o dispositivo de monitoramento de isolamento. Bits reservados devem ser tratados conforme a lista do controlador.""",

"""APÊNDICE I - TABELA DE FALHAS (continuação)
16 Tempo excedido no monitoramento de isolamento - substituir o dispositivo.
17 Monitoramento de isolamento off-line - inspecionar.
18 Falha do ventilador - verifique comunicação e conector de controle na placa principal.
19 Parada de emergência pressionada - libere o botão; se a falha permanecer, substitua ou repare o botão.
20 Porta aberta - feche a porta; verifique e substitua o sensor se necessário.
21 Falha do protetor contra surtos - substitua o protetor.
22 Entrada de água - verifique infiltração e o sensor de água; substitua-o se defeituoso.
23 Tombamento - corrija a posição ou substitua o detector de inclinação.
24 Fumaça - investigue a origem; sem fumaça, verifique e substitua/repare o alarme.
25 Falhas relacionadas ao BEM - existem diversas falhas não listadas; inspecione conforme documentação.
26 Parada BSM - reconecte o conector para iniciar.
27 Erro do medidor CC - verifique o medidor e substitua se não operar.
28 Sobretemperatura CC do EVSE - reconecte; aguarde esfriar, reinicie e repare se necessário.
29 Sobretemperatura CC do conector - verifique sensor e temperatura; substitua o sensor se a falha persistir.
30 Sobretensão de entrada CA - confirme que a tensão solicitada é maior ou igual à real e reconecte o conector.
31 Subtensão de entrada CA - confirme que a tensão real é superior ao mínimo suportado e reconecte.
32 Módulo CA/CC off-line - verifique a comunicação; substitua o módulo se necessário.
33 Erro do módulo CA/CC - verifique a comunicação; substitua o módulo se necessário.
34 Umidade alta - confirme a umidade; se normal, substitua o monitor.
35 Tempo excedido BHM - reconecte o conector.
36 Tempo excedido BRM - reconecte o conector.
37 Tempo excedido BCP - reconecte o conector.
38 Tempo excedido BRO - reconecte o conector.
39 Tempo excedido BCS - reconecte o conector.
40 Tempo excedido BCL - reconecte o conector.
41 Tempo excedido BSM - reconecte o conector.
42 Tempo excedido BST - reconecte o conector.
43 Tempo excedido BSD - reconecte o conector.
44 Falha do disjuntor MCCB - verifique se disparou; rearme; se persistir, substitua/repare.
45 Erro de dados PT1000 - verifique sensores de temperatura e fiação; substitua o sensor se necessário.
46 PE não detectado - verifique a conexão PE; se correta e a falha persistir, substitua a placa principal.
47 DLB off-line - verifique a fiação; se correta e a falha persistir, substitua o DLB.""",

"""APÊNDICE II - DIAGRAMA ELÉTRICO ESQUEMÁTICO
Consulte a ilustração original desta página. As identificações gráficas do esquema foram mantidas no idioma original.

APÊNDICE III - GUIA DE MANUTENÇÃO DO EQUIPAMENTO DE RECARGA

1. Requisitos para a equipe de manutenção
- Possuir certificados e qualificações pertinentes.
- Conhecer o princípio básico de funcionamento, o uso, os métodos e os requisitos de manutenção.
- Conhecer procedimentos de emergência e solução simples de falhas.

2. Inspeção de segurança e manutenção - conteúdo e periodicidade
1. Carcaça sem riscos ou ferrugem e parafusos da base firmes - mensal.
2. Sinalizações externas completas e legíveis - conforme plano de inspeção.
3. Fechaduras, vedações e cola da antena íntegras, sem infiltração - mensal.
4. Disjuntor de entrada e proteção contra fuga operando normalmente - mensal.
5. Limpar furos de dissipação e filtro de ar - semestral.
6. Limpar poeira e sujeira da carcaça e do dispositivo de conexão.
7. Conector sem danos e cabo sem riscos ou trincas.
8. Interior limpo, componentes e cabos sem marcas de queimadura.
9. Remover poeira interna e manter os componentes limpos.
10. Com energia desligada, verificar conexões internas, parafusos das barras de cobre e envelhecimento dos isolantes - a cada três meses.
11. Após energizar, verificar interação homem-máquina, indicadores e tela.
12. Durante a recarga, pressionar a parada de emergência e confirmar interrupção imediata da saída.
13. Verificar se o ventilador funciona normalmente e sem superaquecimento.

3. Inspecione e mantenha também antes e depois de condições climáticas extremas, quando a mesma falha ocorrer repetidamente em curto prazo e durante a operação experimental.

4. Ao detectar defeito, afixe sinalização visível e programe manutenção, descarte ou substituição conforme a gravidade.""",

"""APÊNDICE IV - CARTÃO DE GARANTIA DO PRODUTO

Obrigado por escolher nossos produtos. O período de garantia começa na data de comissionamento.

Durante a garantia, o produto deve ser instalado e utilizado conforme este manual. Em condições normais, defeitos de matéria-prima ou fabricação dão direito à manutenção gratuita nos termos desta garantia. Guarde este cartão como comprovante; em caso de perda, não será emitida segunda via.

Não há cobertura gratuita nas seguintes situações:
- Instalação ou ambiente de instalação em desacordo com requisitos, normas e especificações do produto.
- Uso ou armazenamento inadequado, desmontagem não autorizada, manutenção particular ou outros atos do usuário.
- Danos por desastres naturais, como terremoto, inundação ou raio, ou por eventos externos, como incêndio e colapso de edificação.
- Falha ou dano causado por mudança de local, transferência, transporte ou armazenamento inadequado.
- Produto fora do prazo de garantia.

Observação: para produtos fora do prazo ou não cobertos pelos termos, será feita inspeção para definir reparo ou substituição de peças, com cobrança conforme aplicável.

FORMULÁRIO DE GARANTIA
Informações do produto: nome; modelo; número de série.
Informações do cliente: contato; data de comissionamento; endereço.
Fabricante: Zhejiang Benyi New Energy Co., Ltd.
Contato do fabricante.
Itens de garantia.
Campos de assinatura e data.""",
]


def register_fonts():
    regular = Path(r"C:\Windows\Fonts\arial.ttf")
    bold = Path(r"C:\Windows\Fonts\arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("Arial", str(regular)))
        pdfmetrics.registerFont(TTFont("Arial-Bold", str(bold)))
        return "Arial", "Arial-Bold"
    return "Helvetica", "Helvetica-Bold"


def wrap(text, font, size, width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = word if not current else current + " " + word
        if pdfmetrics.stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def tokenize(text):
    out = []
    for raw in text.splitlines():
        s = raw.strip()
        if not s:
            out.append(("space", ""))
        elif re.match(r"^(MANUAL|SUMÁRIO|PREFÁCIO|PRECAUÇÕES|ATENÇÃO|\d+\.|APÊNDICE|FORMULÁRIO)", s, re.I):
            out.append(("heading", s))
        else:
            out.append(("body", s))
    return out


def measure(tokens, font, bold, size, width, leading):
    total = 0
    for kind, text in tokens:
        if kind == "space":
            total += leading * 0.55
        else:
            f = bold if kind == "heading" else font
            total += len(wrap(text, f, size + (0.35 if kind == "heading" else 0), width)) * leading
            total += leading * (0.25 if kind == "heading" else 0.08)
    return total


def draw_flow(c, text, x, y_top, width, height, font, bold):
    tokens = tokenize(text)
    gutter = 14
    col_w = (width - gutter) / 2
    size = 9.2
    while size >= 4.8:
        leading = size * 1.22
        required = measure(tokens, font, bold, size, col_w, leading)
        if required <= height * 2:
            break
        size -= 0.2

    cols = [(x, y_top), (x + col_w + gutter, y_top)]
    col = 0
    cursor = y_top
    min_y = y_top - height
    for kind, text in tokens:
        leading = size * 1.22
        if kind == "space":
            cursor -= leading * 0.55
            continue
        f = bold if kind == "heading" else font
        fs = size + (0.35 if kind == "heading" else 0)
        lines = wrap(text, f, fs, col_w)
        need = len(lines) * leading + leading * (0.25 if kind == "heading" else 0.08)
        if cursor - need < min_y and col == 0:
            col = 1
            cursor = y_top
        if cursor - need < min_y:
            # Last-resort continuation at the bottom; size fitting normally avoids this.
            lines = lines[: max(1, int((cursor - min_y) / leading))]
        c.setFont(f, fs)
        c.setFillColor(HexColor("#14324A") if kind == "heading" else HexColor("#202A33"))
        for line in lines:
            c.drawString(cols[col][0], cursor, line)
            cursor -= leading
        cursor -= leading * (0.25 if kind == "heading" else 0.08)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    reader = PdfReader(str(SOURCE))
    page_w = float(reader.pages[0].mediabox.width)
    page_h = float(reader.pages[0].mediabox.height)
    font, bold = register_fonts()
    c = canvas.Canvas(str(OUTPUT), pagesize=(page_w, page_h), pageCompression=1)
    c.setTitle("Manual BENY - Estação CC com 2 conectores - PT-BR")
    c.setAuthor("Tradução para PT-BR preparada a partir do manual BENY")

    for idx, pt_text in enumerate(PAGES, 1):
        c.setFillColor(white)
        c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
        c.setFillColor(HexColor("#075A8A"))
        c.rect(0, page_h - 48, page_w, 48, fill=1, stroke=0)
        c.setFont(bold, 16)
        c.setFillColor(white)
        c.drawString(28, page_h - 31, "MANUAL BENY - TRADUÇÃO PT-BR")
        c.setFont(font, 8)
        c.drawRightString(page_w - 28, page_h - 29, f"Página {idx} de {len(PAGES)}")

        left_x, left_w = 28, 500
        preview_y = 360
        preview_h = 340
        image_path = RENDER_DIR / f"page-{idx:02d}.png"
        if image_path.exists():
            img = ImageReader(str(image_path))
            iw, ih = img.getSize()
            scale = min(left_w / iw, preview_h / ih)
            dw, dh = iw * scale, ih * scale
            c.setFillColor(HexColor("#E9EEF2"))
            c.roundRect(left_x - 6, preview_y - 6, left_w + 12, preview_h + 12, 7, fill=1, stroke=0)
            c.drawImage(img, left_x + (left_w - dw) / 2, preview_y + (preview_h - dh) / 2,
                        width=dw, height=dh, preserveAspectRatio=True, mask='auto')
        c.setFont(bold, 10)
        c.setFillColor(HexColor("#075A8A"))
        c.drawString(left_x, 330, "REFERÊNCIA VISUAL DA PÁGINA ORIGINAL")
        c.setFont(font, 8.2)
        c.setFillColor(HexColor("#4A5964"))
        note = ("As imagens, diagramas e capturas de tela foram mantidos no idioma original, "
                "conforme solicitado. O texto integral em português está disposto ao lado.")
        yy = 313
        for line in wrap(note, font, 8.2, left_w):
            c.drawString(left_x, yy, line)
            yy -= 11
        c.setStrokeColor(HexColor("#B8C6D0"))
        c.line(550, 28, 550, page_h - 68)

        draw_flow(c, pt_text, 572, page_h - 74, page_w - 600, page_h - 112, font, bold)

        c.setFont(font, 6.5)
        c.setFillColor(HexColor("#6E7C87"))
        c.drawString(28, 18, "Documento traduzido para português do Brasil. Valores técnicos, códigos, modelos e normas foram preservados.")
        c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()

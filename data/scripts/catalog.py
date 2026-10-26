"""人工编写的公开信息索引、演示业务规则和多语种场景。"""
AS_OF = '2026-10-24T04:00:00Z'
VERSION = '1.0.0'
SEED = 20261024

SOURCES = [
 ('SRC-01','沃太能源：企业简介','https://www.alphaess.cn/company-profile','AlphaESS','企业背景','2012年成立；覆盖家庭、工商业和源网侧储能，具备BMS、EMS和云管理等能力。'),
 ('SRC-02','沃太能源：产品目录','https://www.alphaess.cn/products','AlphaESS','产品目录','公开列有户用SMILE、工商业STORION/StaX、储能柜、集装箱、充电桩和阳台储能产品。'),
 ('SRC-03','AlphaESS Docs: Help and Support','https://docs.alphaess.com/portals/portal-home-owners/vpp-apps-and-support/help-and-support.html','AlphaESS','售后流程','在线服务中心支持提交工单并跟踪；报修应提供SN、发生时间和现象，安装配置问题通常先联系安装商。'),
 ('SRC-04','沃太能源2023年可持续发展报告','https://www.alphaess.cn/Public/Uploads/uploadfile/files/20240703/AlphaESS_ESG_Report_CN_2023.pdf','AlphaESS','历史服务背景','报告描述AlphaCloud客诉渠道、服务过程跟踪和客户投诉及售后问题处理制度；仅作为2023年度历史资料。'),
 ('SRC-05','SMILE-G3单相储能一体机','https://www.alphaess.cn/smile-g3-3-6kw-5kw-residential-energy-storage-system','AlphaESS','产品核对','页面明确列出SMILE-G3-S5，额定功率5kW；不同电池配置容量不同。'),
 ('SRC-06','StaX-M30/M50','https://www.alphaess.cn/m30-m50','AlphaESS','产品核对','公开的工商业并离网光储产品系列，30kW/50kW。'),
 ('SRC-07','曜方5000 2.0','https://www.alphaess.cn/ylxt','AlphaESS','产品核对','公开的5MWh液冷储能系统。'),
 ('SRC-08','星跃221/261','https://www.alphaess.cn/lc-tb125','AlphaESS','产品核对','公开的221kWh/261kWh液冷户外储能柜系列。'),
 ('SRC-09','Tesla: Troubleshooting Your Powerwall','https://www.tesla.com/support/energy/powerwall/own/troubleshooting','Tesla','服务对标','按问题开展初步排查，未解决则转技术支持；危险迹象需要停止常规自助排查。'),
 ('SRC-10','Tesla: What to Know About Scheduling Service','https://www.tesla.com/support/energy/solar-panels/after-installation/what-to-know-about-scheduling-service','Tesla','服务对标','客户支持先协助排查；确认需现场服务后创建服务案例并安排预约。'),
 ('SRC-11','BYD Battery-Box: Contact','https://site.bydbatterybox.com/byd-contact','BYD Battery-Box','服务对标','通过本地服务合作伙伴提供区域支持。'),
 ('SRC-12','BYD Battery-Box: Downloads','https://bydbatterybox.com/downloads','BYD Battery-Box','产品与服务对标','公开提供服务检查表、应用指南以及按地区和版本区分的保修文件。'),
 ('SRC-13','Sungrow: Installer Service Support','https://www.sungrowpower.com/en/installer/service-support','Sungrow','服务对标','安装商服务入口提供文档、质保、技术支持、远程服务和现场服务等资源。'),
 ('SRC-14','AlphaESS Europe: Contact','https://eu.alphaess.com/pages/contact-us','AlphaESS Europe','区域入口','欧洲联系页面提示技术支持应使用工单系统。'),
]

# 产品名称/公开标称值为事实；ID、模拟部署地区和设备配置不是官方数据。
PRODUCTS = [
 ('PRD-01','SMILE5','residential',5,None,'SRC-02'),
 ('PRD-02','SMILE-G3-S5','residential',5,None,'SRC-05'),
 ('PRD-03','SMILE-G3-T10','residential',10,None,'SRC-02'),
 ('PRD-04','SMILE-S6-HV','residential',6,None,'SRC-02'),
 ('PRD-05','SMILE-T10-HV','residential',10,None,'SRC-02'),
 ('PRD-06','STORION-H30-G3','commercial',30,None,'SRC-02'),
 ('PRD-07','STORION-H50-G3','commercial',50,None,'SRC-02'),
 ('PRD-08','StaX-M50','commercial',50,None,'SRC-06'),
 ('PRD-09','星跃261','commercial',None,261,'SRC-08'),
 ('PRD-10','曜方5000 2.0','utility',None,5000,'SRC-07'),
 ('PRD-11','SMILE-G3-EVCT11','ev_charger',11,None,'SRC-02'),
 ('PRD-12','VitaPower VT1000','balcony',1,None,'SRC-02'),
]
REGIONS = [
 ('DE','德国','de','Europe/Berlin','柏林','EMEA'),
 ('NL','荷兰','nl','Europe/Amsterdam','乌得勒支','EMEA'),
 ('ES','西班牙','es','Europe/Madrid','马德里','EMEA'),
 ('GB','英国','en','Europe/London','曼彻斯特','EMEA'),
 ('AU','澳大利亚','en','Australia/Sydney','悉尼','APAC'),
 ('CN','中国','zh','Asia/Shanghai','苏州','APAC'),
 ('FR','法国','fr','Europe/Paris','里昂','EMEA'),
 ('IT','意大利','it','Europe/Rome','米兰','EMEA'),
]
CATEGORIES = [
 ('connectivity','设备联网与离线','cloud', ['serial_number','occurred_at','symptom_description']),
 ('charging','无法充电或放电','technical',['serial_number','occurred_at','symptom_description']),
 ('monitoring','数据展示与统计异常','cloud',['serial_number','occurred_at','symptom_description']),
 ('backup','备用供电问题','technical',['serial_number','occurred_at','symptom_description']),
 ('commissioning','安装与调试','technical',['serial_number','occurred_at','symptom_description']),
 ('alarm','设备告警待排查','technical',['serial_number','occurred_at','symptom_description']),
 ('performance','运行效果与收益疑问','technical',['serial_number','occurred_at','symptom_description']),
 ('account','账号与授权','cloud',['symptom_description']),
 ('warranty','保修与退换咨询','warranty',['serial_number','symptom_description','purchase_proof']),
 ('cooling','工商业温控问题','technical',['serial_number','occurred_at','symptom_description']),
 ('dispatch','项目通信与调度','technical',['serial_number','occurred_at','symptom_description']),
 ('ev','充电桩问题','technical',['serial_number','occurred_at','symptom_description']),
 ('safety','安全风险报告','safety',['symptom_description']),
 ('unknown','无法判断，需要人工','global',['symptom_description']),
]

# 各语言仅描述客户观察，不包含维修步骤、真实故障码释义或官方承诺。
TEXTS = {
 'offline': [
  '更换家中路由器后，App一直显示设备离线；设备面板仍亮着。',
  'Since we changed the home router, the app has shown the system offline. The device display is still on.',
  'Seit dem Routerwechsel zeigt die App das System als offline an. Das Display am Gerät ist noch an.',
  'Na het vervangen van de router toont de app het systeem als offline. Het scherm op het apparaat staat nog aan.',
  'Desde que cambiamos el router, la aplicación muestra el sistema sin conexión. La pantalla del equipo sigue encendida.',
  "Depuis le changement de routeur, l’application indique que le système est hors ligne. L’écran de l’appareil est allumé.",
  'Dopo il cambio del router, l’app mostra il sistema offline. Il display del dispositivo è ancora acceso.'
 ],
 'charge': [
  '白天有光伏发电，但电池电量一直没有上升，请协助核实。',
  'There is solar generation during the day, but the battery level is not increasing. Please help us check.',
  'Tagsüber wird Solarstrom erzeugt, aber der Batteriestand steigt nicht. Bitte prüfen Sie das.',
  'Overdag wordt zonnestroom opgewekt, maar het batterijniveau stijgt niet. Kunt u dit controleren?',
  'Hay generación solar durante el día, pero el nivel de la batería no aumenta. Necesitamos ayuda.',
  'Il y a une production solaire en journée, mais le niveau de la batterie ne monte pas. Merci de vérifier.',
  'Di giorno c’è produzione solare, ma il livello della batteria non aumenta. Chiediamo una verifica.'
 ],
 'discharge': [
  '夜间仍从电网购电，电池有电但没有放电；不清楚是否与设置有关。',
  'At night we still import from the grid while the battery has charge but does not discharge. We are unsure about the settings.',
  'Nachts beziehen wir Netzstrom, obwohl die Batterie geladen ist und nicht entlädt. Die Einstellungen sind unklar.',
  '’s Nachts gebruiken we netstroom terwijl de batterij geladen is maar niet ontlaadt. De instellingen zijn ons niet duidelijk.',
  'Por la noche seguimos comprando energía de la red aunque la batería tiene carga y no descarga. No conocemos bien los ajustes.',
  'La nuit, nous consommons du réseau alors que la batterie est chargée et ne se décharge pas. Les réglages sont à vérifier.',
  'Di notte preleviamo dalla rete anche se la batteria è carica e non si scarica. Non conosciamo bene le impostazioni.'
 ],
 'chart': [
  '昨天的发电曲线缺了几个小时，电表读数与App汇总不一致。',
  'Several hours are missing from yesterday’s generation chart, and the meter reading differs from the app total.',
  'In der Erzeugungskurve von gestern fehlen mehrere Stunden. Zähler und App zeigen unterschiedliche Summen.',
  'In de opbrengstgrafiek van gisteren ontbreken enkele uren. De meter en de app tonen verschillende totalen.',
  'Faltan varias horas en la gráfica de generación de ayer y el contador no coincide con el total de la aplicación.',
  'Plusieurs heures manquent sur la courbe de production d’hier, et le compteur diffère du total de l’application.',
  'Nel grafico di produzione di ieri mancano alcune ore e il contatore non coincide con il totale dell’app.'
 ],
 'backup': [
  '昨晚电网停电时，预期接入备用供电的照明没有供电；目前电网已恢复。',
  'During last night’s grid outage, the lights expected to have backup power went out. Grid power has now returned.',
  'Beim Netzausfall gestern Abend blieben die für Ersatzstrom vorgesehenen Lampen aus. Das Netz ist wieder da.',
  'Tijdens de stroomuitval gisteravond werkten de lampen op de verwachte noodvoeding niet. Het net is hersteld.',
  'Durante el corte de anoche, las luces previstas para respaldo no funcionaron. La red ya se ha restablecido.',
  'Pendant la coupure d’hier soir, les lampes prévues sur le secours ne fonctionnaient pas. Le réseau est rétabli.',
  'Durante il blackout di ieri sera, le luci previste sul backup non funzionavano. La rete è stata ripristinata.'
 ],
 'commission': [
  '我是安装商，首次调试时平台还看不到这台设备，需要确认登记信息。',
  'I am the installer. During first commissioning the device is not visible in the portal. Please check the registration.',
  'Ich bin Installateur. Bei der Erstinbetriebnahme erscheint das Gerät nicht im Portal. Bitte die Registrierung prüfen.',
  'Ik ben de installateur. Bij de eerste ingebruikname is het apparaat niet zichtbaar in het portaal. Graag de registratie controleren.',
  'Soy el instalador. Durante la puesta en marcha el equipo no aparece en el portal. Necesito verificar el registro.',
  'Je suis l’installateur. À la première mise en service, l’appareil n’apparaît pas sur le portail. Merci de vérifier l’enregistrement.',
  'Sono l’installatore. Alla prima messa in servizio il dispositivo non appare nel portale. Chiedo una verifica della registrazione.'
 ],
 'alarm': [
  '设备面板显示一条告警，但照片中的代码看不清；请不要仅凭照片判断损坏部件。',
  'The device display shows an alarm, but the code in the photo is unreadable. Please do not infer a failed component from the photo alone.',
  'Das Gerät zeigt eine Warnung, aber der Code auf dem Foto ist unleserlich. Daraus lässt sich kein defektes Bauteil bestimmen.',
  'Het apparaat toont een alarm, maar de code op de foto is onleesbaar. Hieruit kan geen defect onderdeel worden vastgesteld.',
  'El equipo muestra una alarma, pero el código de la foto es ilegible. No se puede identificar una pieza averiada solo con esa foto.',
  'L’appareil affiche une alarme, mais le code sur la photo est illisible. Cette photo seule ne permet pas d’identifier une pièce défectueuse.',
  'Il dispositivo mostra un allarme, ma il codice nella foto non è leggibile. La sola foto non identifica un componente guasto.'
 ],
 'yield': [
  '账单节省金额比预期少，希望核对用电时段和平台统计口径，不是要求保证收益。',
  'Bill savings are lower than expected. We want to review usage times and the portal calculation, not request guaranteed returns.',
  'Die Einsparung ist geringer als erwartet. Bitte Verbrauchszeiten und Berechnung prüfen; wir verlangen keine Ertragsgarantie.',
  'De besparing is lager dan verwacht. We willen verbruikstijden en de berekening controleren, zonder gegarandeerde opbrengst te vragen.',
  'El ahorro es menor de lo esperado. Queremos revisar horarios y cálculos, sin solicitar rentabilidad garantizada.',
  'Les économies sont inférieures aux attentes. Nous souhaitons vérifier les horaires et le calcul, sans demander de rendement garanti.',
  'Il risparmio è inferiore alle attese. Vorremmo verificare orari e calcoli, senza chiedere un rendimento garantito.'
 ],
 'account': [
  '更换房主后，新房主无法查看设备；原安装商账号仍能看到，需要核对授权。',
  'After a change of owner, the new owner cannot see the system, while the original installer can. Please review access authorization.',
  'Nach dem Eigentümerwechsel sieht der neue Eigentümer das System nicht, der ursprüngliche Installateur aber schon. Bitte Zugriffsrechte prüfen.',
  'Na de eigendomsoverdracht ziet de nieuwe eigenaar het systeem niet, maar de oorspronkelijke installateur wel. Graag de toegangsrechten controleren.',
  'Tras el cambio de propietario, el nuevo dueño no ve el sistema y el instalador anterior sí. Deben revisarse los permisos.',
  'Après le changement de propriétaire, le nouvel occupant ne voit pas le système, mais l’ancien installateur le voit. Merci de vérifier les droits.',
  'Dopo il cambio di proprietario, il nuovo titolare non vede il sistema mentre il vecchio installatore sì. Verificare le autorizzazioni.'
 ],
 'warranty': [
  '想咨询设备是否符合保修条件以及申请需要哪些材料，暂时找不到购买凭证。',
  'We would like to ask about warranty eligibility and the documents needed. We cannot currently find the purchase receipt.',
  'Wir möchten die Garantiebedingungen und nötigen Unterlagen klären. Der Kaufbeleg ist derzeit nicht auffindbar.',
  'We willen weten of garantie mogelijk is en welke documenten nodig zijn. De aankoopbon is momenteel zoek.',
  'Queremos consultar la cobertura de garantía y los documentos necesarios. Ahora no encontramos el justificante de compra.',
  'Nous souhaitons connaître les conditions de garantie et les documents nécessaires. La preuve d’achat est introuvable pour le moment.',
  'Vorremmo conoscere le condizioni di garanzia e i documenti necessari. Al momento manca la prova d’acquisto.'
 ],
 'cooling': [
  '工商业储能柜显示温控告警，项目人员已记录现场状态，需要技术人员评估。',
  'The commercial storage cabinet shows a thermal-control alarm. Site staff have recorded the condition and need technical review.',
  'Der Gewerbespeicherschrank zeigt eine Temperaturregelungswarnung. Das Team hat den Zustand dokumentiert und benötigt technische Prüfung.',
  'De zakelijke opslagkast toont een alarm voor de temperatuurregeling. De situatie is vastgelegd en moet technisch worden beoordeeld.',
  'El armario de almacenamiento comercial muestra una alarma de control térmico. El personal ha documentado la situación y solicita revisión técnica.',
  'L’armoire de stockage commercial affiche une alarme de régulation thermique. La situation est documentée et nécessite un examen technique.',
  'L’armadio di accumulo commerciale mostra un allarme termico. Il personale ha documentato la situazione e chiede una valutazione tecnica.'
 ],
 'dispatch': [
  '项目平台看不到部分设备的运行数据，现场说设备在运行，需核对通信链路。',
  'The project portal has no operating data for some devices, while site staff say they are running. Please review communications.',
  'Im Projektportal fehlen Betriebsdaten einiger Geräte, die laut Team laufen. Bitte die Kommunikation prüfen.',
  'Het projectportaal mist bedrijfsgegevens van enkele apparaten die volgens het team wel draaien. Graag de communicatie controleren.',
  'El portal del proyecto no muestra datos de algunos equipos que, según el personal, siguen funcionando. Revisar las comunicaciones.',
  'Le portail du projet n’affiche pas les données de certains appareils pourtant en fonctionnement selon l’équipe. Vérifier la communication.',
  'Il portale del progetto non mostra i dati di alcuni dispositivi che risultano in funzione sul posto. Verificare la comunicazione.'
 ],
 'ev': [
  '车辆接入充电桩后未开始充电，车辆在其他地点能充电，需进一步确认情况。',
  'The car does not start charging when connected here, but charges elsewhere. Further checks are needed.',
  'Das Auto lädt an dieser Ladestation nicht, an anderen Orten aber schon. Weitere Prüfung erforderlich.',
  'De auto begint hier niet te laden, maar laadt elders wel. Verder onderzoek is nodig.',
  'El coche no empieza a cargar en este punto, pero sí carga en otros lugares. Hace falta revisar el caso.',
  'La voiture ne démarre pas la charge ici, mais elle charge ailleurs. Un examen complémentaire est nécessaire.',
  'L’auto non avvia la ricarica qui, ma si ricarica altrove. Serve un’ulteriore verifica.'
 ],
 'smoke': [
  '设备附近出现烟雾和焦糊味，现场人员正在远离设备，请立即转人工应急处理。',
  'There is smoke and a burning smell near the system. People are moving away. Please escalate immediately to a human emergency contact.',
  'Am System sind Rauch und Brandgeruch wahrnehmbar. Personen entfernen sich. Bitte sofort an die menschliche Notfallstelle eskalieren.',
  'Er is rook en een brandlucht bij het systeem. Mensen nemen afstand. Graag onmiddellijk doorzetten naar menselijke noodhulp.',
  'Hay humo y olor a quemado cerca del sistema. Las personas se están alejando. Escalar de inmediato a atención humana de emergencia.',
  'Il y a de la fumée et une odeur de brûlé près du système. Les personnes s’éloignent. Transmettre immédiatement à un responsable humain d’urgence.',
  'Ci sono fumo e odore di bruciato vicino al sistema. Le persone si stanno allontanando. Inoltrare subito a un responsabile umano per le emergenze.'
 ],
 'water': [
  '暴雨后设备附近有积水，无法确认设备是否进水，请立即安排人工风险评估。',
  'There is standing water near the system after heavy rain. We cannot confirm water ingress. Please arrange immediate human risk assessment.',
  'Nach Starkregen steht Wasser am System. Wassereintritt ist unklar. Bitte sofortige menschliche Risikoprüfung veranlassen.',
  'Na zware regen staat water bij het systeem. Binnendringen van water is niet bevestigd. Graag direct menselijke risicobeoordeling.',
  'Hay agua acumulada cerca del sistema tras la lluvia. No se sabe si ha entrado agua. Solicitar evaluación humana inmediata.',
  'De l’eau stagne près du système après de fortes pluies. Une infiltration n’est pas confirmée. Demander une évaluation humaine immédiate.',
  'Dopo forti piogge c’è acqua vicino al sistema. L’ingresso di acqua non è confermato. Richiesta valutazione umana immediata.'
 ],
 'noise': [
  '设备运行声音比以前大，但没有烟雾、没有焦糊味，也没有观察到异常发热。',
  'Operating noise is louder than before, but there is no smoke, no burning smell and no observed overheating.',
  'Das Betriebsgeräusch ist lauter als früher, aber es gibt keinen Rauch, keinen Brandgeruch und keine bemerkte Überhitzung.',
  'Het apparaat maakt meer geluid dan eerder, maar er is geen rook, geen brandlucht en geen waargenomen oververhitting.',
  'El equipo hace más ruido, pero no hay humo, olor a quemado ni sobrecalentamiento observado.',
  'Le bruit est plus fort, mais il n’y a ni fumée, ni odeur de brûlé, ni surchauffe observée.',
  'Il rumore è più forte, ma non ci sono fumo, odore di bruciato o surriscaldamento osservato.'
 ],
 'unknown': [
  '设备不太对，我说不清是什么问题，希望有人联系我。',
  'Something is wrong with the system. I cannot describe the problem clearly and would like someone to contact me.',
  'Mit dem System stimmt etwas nicht. Ich kann das Problem nicht genau beschreiben und bitte um Rückmeldung.',
  'Er is iets mis met het systeem. Ik kan het niet duidelijk beschrijven en wil graag worden gebeld.',
  'Algo no va bien con el sistema. No puedo explicarlo con claridad y necesito que contacten conmigo.',
  'Quelque chose ne va pas avec le système. Je ne sais pas l’expliquer et souhaite être recontacté.',
  'C’è qualcosa che non va nel sistema. Non riesco a descriverlo e vorrei essere contattato.'
 ],
}
LANGS = ['zh','en','de','nl','es','fr','it']
ISSUES = {
 'offline':('connectivity','P2','联网后离线',[1,2,3,4,5,6,7,8,9,12]),
 'charge':('charging','P2','白天不充电',[1,2,3,4,5,6,7,8,9,12]),
 'discharge':('charging','P2','夜间不放电',[1,2,3,4,5,6,7,8,9,12]),
 'chart':('monitoring','P3','曲线缺失',[1,2,3,4,5,6,7,8,9,10,12]),
 'backup':('backup','P1','备用供电未生效',[1,2,3,4,5,6,7,8]),
 'commission':('commissioning','P2','首次调试登记',[1,2,3,4,5,6,7,8]),
 'alarm':('alarm','P2','告警代码不清',[1,2,3,4,5,6,7,8,9,10]),
 'yield':('performance','P3','收益口径疑问',[1,2,3,4,5,6,7,8,9]),
 'account':('account','P3','设备授权变更',[1,2,3,4,5,6,7,8,9,10,12]),
 'warranty':('warranty','P3','保修材料缺失',[1,2,3,4,5,6,7,8,9,10,11,12]),
 'cooling':('cooling','P1','工商业温控告警',[9,10]),
 'dispatch':('dispatch','P1','项目通信异常',[6,7,8,9,10]),
 'ev':('ev','P2','车辆未开始充电',[11]),
 'smoke':('safety','P0','烟雾与焦糊味',[1,2,3,4,5,6,7,8,9,10,11,12]),
 'water':('safety','P0','暴雨积水风险',[1,2,3,4,5,6,7,8,9,10,11,12]),
 'noise':('alarm','P2','异响且否认危险迹象',[1,2,3,4,5,6,7,8,9,10]),
 'unknown':('unknown','P2','无法描述问题',[1,2,3,4,5,6,7,8,9,10,11,12]),
}
CONTEXTS = {
 'standard': ['请告知受理进展。','Please confirm the case progress.','Bitte den Bearbeitungsstand mitteilen.','Graag een update over de voortgang.','Por favor, informen del progreso.','Merci de confirmer l’avancement.','Confermate lo stato della pratica.'],
 'missing_sn': ['暂时找不到设备序列号。','I cannot find the device serial number yet.','Die Seriennummer ist noch nicht auffindbar.','Ik kan het serienummer nog niet vinden.','Todavía no encuentro el número de serie.','Je ne trouve pas encore le numéro de série.','Non trovo ancora il numero di serie.'],
 'missing_time': ['暂时无法确认具体发生时间。','The exact occurrence time is not yet known.','Der genaue Zeitpunkt ist noch unklar.','Het exacte tijdstip is nog onbekend.','Todavía no sabemos la hora exacta.','L’heure exacte reste inconnue.','L’ora esatta non è ancora nota.'],
 'urgent_claim': ['我很着急，请优先处理，但没有其他异常现象。','This feels urgent to me, but there are no other observed symptoms.','Es ist für mich dringend, aber es gibt keine weiteren beobachteten Symptome.','Dit voelt dringend, maar er zijn geen andere waargenomen symptomen.','Me urge, pero no hay otros síntomas observados.','C’est urgent pour moi, mais aucun autre symptôme n’est observé.','Per me è urgente, ma non ci sono altri sintomi osservati.'],
 'repeat': ['上次处理后短暂恢复，现在同样问题再次出现。','It briefly recovered after the previous case, but the same issue has returned.','Nach der letzten Bearbeitung funktionierte es kurz; das Problem ist wieder da.','Na de vorige melding werkte het even, maar het probleem is terug.','Tras el caso anterior funcionó un tiempo, pero el problema ha vuelto.','Après le précédent dossier, le problème avait disparu brièvement puis est revenu.','Dopo la pratica precedente funzionava, ma il problema è tornato.'],
 'multisite': ['我管理多个站点，这次请只处理当前站点。','I manage several sites; please handle only this site in this case.','Ich verwalte mehrere Standorte; dieser Fall betrifft nur diesen Standort.','Ik beheer meerdere locaties; behandel in deze melding alleen deze locatie.','Gestiono varios sitios; este caso afecta solo a este sitio.','Je gère plusieurs sites ; ce dossier concerne uniquement ce site.','Gestisco più siti; questa pratica riguarda solo questo sito.'],
 'callback': ['请先通过邮件联系，电话不方便接听。','Please email first; I cannot easily take a phone call.','Bitte zuerst per E-Mail kontaktieren; telefonisch bin ich schwer erreichbar.','Graag eerst e-mailen; bellen komt slecht uit.','Contacten primero por correo; no puedo atender llamadas fácilmente.','Merci de me contacter d’abord par courriel, je suis peu disponible au téléphone.','Contattatemi prima via email; non posso rispondere facilmente al telefono.'],
 'no_attachment': ['目前没有照片可以上传。','I do not have a photo to upload yet.','Ich habe noch kein Foto zum Hochladen.','Ik heb nog geen foto om te uploaden.','Todavía no tengo una foto para subir.','Je n’ai pas encore de photo à joindre.','Non ho ancora foto da caricare.'],
 'negative_safety': ['没有观察到烟雾、异味或异常发热。','No smoke, unusual smell or overheating has been observed.','Kein Rauch, ungewöhnlicher Geruch oder Überhitzen beobachtet.','Geen rook, vreemde geur of oververhitting waargenomen.','No se han observado humo, olores extraños ni sobrecalentamiento.','Aucune fumée, odeur inhabituelle ou surchauffe observée.','Non sono stati osservati fumo, odori insoliti o surriscaldamento.'],
}

# 48类业务组合；每类10条，语言/产品/进度/时间/客户不同。
SCENARIOS = []
for issue in ISSUES:
    SCENARIOS.append((issue,'standard'))
for issue in ['offline','charge','backup','commission','alarm','cooling','dispatch','ev','smoke','unknown']:
    SCENARIOS.append((issue,'missing_sn'))
for issue in ['offline','charge','chart','backup','alarm','dispatch']:
    SCENARIOS.append((issue,'missing_time'))
for issue in ['charge','chart','noise']:
    SCENARIOS.append((issue,'urgent_claim'))
for issue in ['offline','charge','alarm','cooling']:
    SCENARIOS.append((issue,'repeat'))
for issue in ['chart','dispatch','warranty']:
    SCENARIOS.append((issue,'multisite'))
for issue in ['account','warranty']:
    SCENARIOS.append((issue,'callback'))
for issue in ['alarm','backup','charge']:
    SCENARIOS.append((issue,'no_attachment'))
assert len(SCENARIOS) == 48

SLA = {
 'P0': {'label':'安全紧急','first_response_minutes':15,'next_action_minutes':30},
 'P1': {'label':'高优先级','first_response_minutes':60,'next_action_minutes':240},
 'P2': {'label':'一般故障','first_response_minutes':240,'next_action_minutes':1440},
 'P3': {'label':'普通咨询','first_response_minutes':1440,'next_action_minutes':4320},
}
PATHS = {
 'new':['new'],
 'awaiting_review':['new','awaiting_review'],
 'waiting_customer':['new','awaiting_review','waiting_customer'],
 'assigned':['new','awaiting_review','assigned'],
 'in_progress':['new','awaiting_review','assigned','in_progress'],
 'waiting_parts':['new','awaiting_review','assigned','in_progress','waiting_parts'],
 'waiting_visit':['new','awaiting_review','assigned','in_progress','waiting_visit'],
 'escalated':['new','awaiting_review','assigned','escalated'],
 'resolved':['new','awaiting_review','assigned','in_progress','resolved'],
 'closed':['new','awaiting_review','assigned','in_progress','resolved','closed'],
 'cancelled':['new','awaiting_review','cancelled'],
 'merged':['new','awaiting_review','merged'],
 'reopened':['new','awaiting_review','assigned','in_progress','resolved','closed','reopened'],
}

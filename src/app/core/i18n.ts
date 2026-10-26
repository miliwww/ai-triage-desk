import { Injectable, effect, signal } from '@angular/core';
import { DEMO_NOW_MS } from './format';
import { PORTFOLIO_COPY } from './portfolio-copy';

export type Lang = 'zh' | 'en' | 'de' | 'nl' | 'es' | 'fr' | 'it';

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'zh', label: '中文', short: 'ZH' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'nl', label: 'Nederlands', short: 'NL' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'it', label: 'Italiano', short: 'IT' },
];

type Row = [key: string, zh: string, en: string, de: string, nl: string, es: string, fr: string, it: string];

/** 界面语言包：zh / en / de / nl / es / fr / it。业务模拟内容与原文保持数据中的语言。 */
const ROWS: Row[] = [
  // 外壳
  ['shell.searchPlaceholder', '搜索工单编号 / SN / 摘要，回车检索', 'Search ticket, SN or summary, press Enter', 'Ticket, SN oder Zusammenfassung suchen, Enter', 'Zoek ticket, SN of samenvatting, Enter', 'Buscar ticket, SN o resumen, Intro', 'Rechercher ticket, SN ou résumé, Entrée', 'Cerca ticket, SN o riepilogo, Invio'],
  ['shell.simulated', '模拟数据', 'Simulated data', 'Simulierte Daten', 'Gesimuleerde data', 'Datos simulados', 'Données simulées', 'Dati simulati'],
  ['shell.clockNote', '冻结演示时钟 · 2026-10-24 12:00', 'Frozen demo clock · 2026-10-24 12:00', 'Eingefrorene Demo-Uhr · 2026-10-24 12:00', 'Bevroren demoklok · 2026-10-24 12:00', 'Reloj demo congelado · 2026-10-24 12:00', 'Horloge démo figée · 2026-10-24 12:00', 'Orologio demo congelato · 2026-10-24 12:00'],
  ['shell.reset', '重置演示数据', 'Reset demo data', 'Demodaten zurücksetzen', 'Demodata resetten', 'Restablecer datos demo', 'Réinitialiser les données démo', 'Reimposta dati demo'],
  ['shell.resetConfirm', '再次点击确认重置', 'Click again to confirm', 'Erneut klicken zum Bestätigen', 'Nogmaals klikken om te bevestigen', 'Clic de nuevo para confirmar', 'Cliquez à nouveau pour confirmer', 'Clicca di nuovo per confermare'],
  ['shell.resetWarn', '再次点击“确认重置”将恢复 492 条种子工单，本次演示操作会丢失。', 'Click "Confirm reset" again to restore 492 seed tickets; demo changes will be lost.', 'Erneut „Zurücksetzen“ klicken: 492 Seed-Tickets werden wiederhergestellt, Demoänderungen gehen verloren.', 'Klik nogmaals op „Reset“ om 492 seedtickets te herstellen; demowijzigingen gaan verloren.', 'Pulsa de nuevo para restaurar 492 tickets semilla; los cambios demo se perderán.', 'Cliquez à nouveau pour restaurer 492 tickets source ; les modifications démo seront perdues.', 'Clicca di nuovo per ripristinare 492 ticket seed; le modifiche demo andranno perse.'],
  ['shell.resetDone', '已重置为种子数据：492 条工单', 'Reset to seed data: 492 tickets', 'Auf Seed-Daten zurückgesetzt: 492 Tickets', 'Teruggezet naar seeddata: 492 tickets', 'Restablecido a datos semilla: 492 tickets', 'Réinitialisé aux données source : 492 tickets', 'Ripristinati i dati seed: 492 ticket'],
  ['shell.user', '演示主管', 'Demo supervisor', 'Demo-Leitung', 'Demo-supervisor', 'Supervisor demo', 'Superviseur démo', 'Supervisore demo'],
  ['shell.role', '售后主管 / 调度', 'Service lead / Dispatcher', 'Serviceleitung / Disposition', 'Servicemanager / Planning', 'Jefe de servicio / Despacho', 'Responsable service / Répartition', 'Responsabile servizio / Smistamento'],
  ['shell.demoScope', '演示边界', 'Demo scope', 'Demo-Grenzen', 'Demogrenzen', 'Alcance demo', 'Périmètre démo', 'Ambito demo'],
  ['shell.demoNote', '种子 492 条工单，操作仅保存在当前浏览器内存；刷新或重置恢复初始数据。AI 为预设演示建议，未接入真实模型，不真实外发消息。', '492 seed tickets. Changes live in browser memory only; refresh or reset restores seeds. AI suggestions are preset; no real model or outbound messages.', '492 Seed-Tickets. Änderungen liegen nur im Browserspeicher; Aktualisieren oder Zurücksetzen stellt den Ausgangszustand her. KI-Vorschläge sind vordefiniert, kein echtes Modell, kein Versand.', '492 seedtickets. Wijzigingen staan alleen in het browsergeheugen; vernieuwen of resetten herstelt de basis. AI-suggesties zijn vooraf ingesteld; geen echt model of verzending.', '492 tickets semilla. Los cambios solo viven en la memoria del navegador; recargar o restablecer recupera la base. Las sugerencias de IA son predefinidas; sin modelo real ni envíos.', '492 tickets source. Les modifications restent en mémoire du navigateur ; actualiser ou réinitialiser restaure la base. Les suggestions IA sont prédéfinies ; aucun modèle réel ni envoi.', '492 ticket seed. Le modifiche restano solo nella memoria del browser; aggiorna o reimposta per tornare alla base. I suggerimenti AI sono predefiniti; nessun modello reale né invio.'],
  ['shell.dataVersion', '数据版本 1.0.0 · 全部为虚构业务数据', 'Data v1.0.0 · All business data is fictional', 'Daten v1.0.0 · Alle Geschäftsdaten sind fiktiv', 'Dataversie 1.0.0 · Alle bedrijfsdata is fictief', 'Datos v1.0.0 · Todos los datos son ficticios', 'Données v1.0.0 · Toutes les données sont fictives', 'Dati v1.0.0 · Tutti i dati sono fittizi'],
  ['shell.language', '界面语言', 'Interface language', 'Oberflächensprache', 'Interfacetaal', 'Idioma de la interfaz', 'Langue de l’interface', 'Lingua dell’interfaccia'],
  // 导航
  ['nav.workspace', '工作台', 'Workspace', 'Arbeitsbereich', 'Werkruimte', 'Espacio de trabajo', 'Espace de travail', 'Area di lavoro'],
  ['nav.overview', '服务总览', 'Service overview', 'Serviceübersicht', 'Serviceoverzicht', 'Resumen de servicio', 'Vue d’ensemble', 'Panoramica servizio'],
  ['nav.tickets', '工单中心', 'Ticket center', 'Ticket-Center', 'Ticketcentrum', 'Centro de tickets', 'Centre des tickets', 'Centro ticket'],
  ['nav.risk', '风险与超时', 'Risk & SLA', 'Risiko & SLA', 'Risico & SLA', 'Riesgo y SLA', 'Risques et SLA', 'Rischi e SLA'],
  ['nav.shortcuts', '快捷视角', 'Quick views', 'Schnellansichten', 'Snelle weergaven', 'Vistas rápidas', 'Vues rapides', 'Viste rapide'],
  ['nav.review', '待人工复核', 'Awaiting review', 'Prüfung ausstehend', 'Wacht op beoordeling', 'Pendiente de revisión', 'En attente de revue', 'In attesa di verifica'],
  ['nav.dispatch', '已复核待派工', 'Reviewed, to dispatch', 'Geprüft, zuzuweisen', 'Beoordeeld, toe te wijzen', 'Revisado, por asignar', 'Revu, à assigner', 'Verificato, da assegnare'],
  ['nav.firstOverdue', '首响超时', 'First response overdue', 'Erstreaktion überfällig', 'Eerste reactie te laat', 'Primera respuesta vencida', 'Première réponse en retard', 'Prima risposta scaduta'],
  ['nav.riskPending', '风险待接管', 'Risk awaiting takeover', 'Risiko wartet auf Übernahme', 'Risico wacht op overname', 'Riesgo pendiente de asunción', 'Risque en attente de prise en charge', 'Rischio in attesa di presa in carico'],
  // 通用
  ['common.all', '全部', 'All', 'Alle', 'Alle', 'Todos', 'Tous', 'Tutti'],
  ['common.allStatus', '全部状态', 'All statuses', 'Alle Status', 'Alle statussen', 'Todos los estados', 'Tous les statuts', 'Tutti gli stati'],
  ['common.allPriority', '全部优先级', 'All priorities', 'Alle Prioritäten', 'Alle prioriteiten', 'Todas las prioridades', 'Toutes les priorités', 'Tutte le priorità'],
  ['common.allCategory', '全部类别', 'All categories', 'Alle Kategorien', 'Alle categorieën', 'Todas las categorías', 'Toutes les catégories', 'Tutte le categorie'],
  ['common.allCountry', '全部国家', 'All countries', 'Alle Länder', 'Alle landen', 'Todos los países', 'Tous les pays', 'Tutti i paesi'],
  ['common.allLanguage', '全部语言', 'All languages', 'Alle Sprachen', 'Alle talen', 'Todos los idiomas', 'Toutes les langues', 'Tutte le lingue'],
  ['common.allTeam', '全部团队', 'All teams', 'Alle Teams', 'Alle teams', 'Todos los equipos', 'Toutes les équipes', 'Tutti i team'],
  ['common.allRisk', '风险：全部', 'Risk: all', 'Risiko: alle', 'Risico: alle', 'Riesgo: todos', 'Risque : tous', 'Rischio: tutti'],
  ['common.allTime', '时效：全部', 'SLA: all', 'SLA: alle', 'SLA: alle', 'SLA: todos', 'SLA : tous', 'SLA: tutti'],
  ['common.allScope', '范围：全部', 'Scope: all', 'Umfang: alle', 'Bereik: alle', 'Ámbito: todos', 'Périmètre : tous', 'Ambito: tutti'],
  ['common.sort', '排序', 'Sort', 'Sortieren', 'Sorteren', 'Ordenar', 'Trier', 'Ordina'],
  ['common.clearAll', '清空筛选', 'Clear filters', 'Filter löschen', 'Filters wissen', 'Limpiar filtros', 'Effacer les filtres', 'Cancella filtri'],
  ['common.clear', '清空', 'Clear', 'Leeren', 'Wissen', 'Limpiar', 'Effacer', 'Cancella'],
  ['common.viewAll', '查看全部', 'View all', 'Alle anzeigen', 'Alles bekijken', 'Ver todo', 'Tout voir', 'Vedi tutto'],
  ['common.detail', '详情', 'Details', 'Details', 'Details', 'Detalles', 'Détails', 'Dettagli'],
  ['common.process', '处理', 'Handle', 'Bearbeiten', 'Behandelen', 'Gestionar', 'Traiter', 'Gestisci'],
  ['common.backList', '返回列表', 'Back to list', 'Zur Liste', 'Terug naar lijst', 'Volver a la lista', 'Retour à la liste', 'Torna all’elenco'],
  ['common.fieldHelp', '字段说明', 'Field guide', 'Feldhilfe', 'Veldgids', 'Guía de campos', 'Guide des champs', 'Guida ai campi'],
  ['common.page', '页', 'Page', 'Seite', 'Pagina', 'Página', 'Page', 'Pagina'],
  ['common.perPage', '每页', 'per page', 'pro Seite', 'per pagina', 'por página', 'par page', 'per pagina'],
  ['common.records', '条', 'records', 'Einträge', 'records', 'registros', 'enregistrements', 'record'],
  ['common.status', '状态', 'Status', 'Status', 'Status', 'Estado', 'Statut', 'Stato'],
  ['common.priority', '优先级', 'Priority', 'Priorität', 'Prioriteit', 'Prioridad', 'Priorité', 'Priorità'],
  ['common.category', '类别', 'Category', 'Kategorie', 'Categorie', 'Categoría', 'Catégorie', 'Categoria'],
  ['common.country', '国家', 'Country', 'Land', 'Land', 'País', 'Pays', 'Paese'],
  ['common.language', '语言', 'Language', 'Sprache', 'Taal', 'Idioma', 'Langue', 'Lingua'],
  ['common.team', '团队', 'Team', 'Team', 'Team', 'Equipo', 'Équipe', 'Team'],
  ['common.owner', '负责人', 'Owner', 'Bearbeiter', 'Eigenaar', 'Responsable', 'Responsable', 'Responsabile'],
  ['common.missing', '缺失资料', 'Missing data', 'Fehlende Daten', 'Ontbrekende gegevens', 'Datos faltantes', 'Données manquantes', 'Dati mancanti'],
  ['common.complete', '齐全', 'Complete', 'Vollständig', 'Compleet', 'Completo', 'Complet', 'Completo'],
  ['common.pending', '待处理', 'Pending', 'Ausstehend', 'Openstaand', 'Pendiente', 'En attente', 'In attesa'],
  ['common.now', '现在', 'now', 'jetzt', 'nu', 'ahora', 'maintenant', 'ora'],
  ['common.sortFocus', '风险 / 超时优先', 'Risk / overdue first', 'Risiko / überfällig zuerst', 'Risico / te laat eerst', 'Riesgo / vencido primero', 'Risque / retard d’abord', 'Rischio / scaduto prima'],
  ['common.sortNewest', '最新创建', 'Newest', 'Neueste', 'Nieuwste', 'Más recientes', 'Plus récents', 'Più recenti'],
  ['common.sortOldest', '最久未解决', 'Oldest unresolved', 'Älteste offen', 'Langst open', 'Más antiguos', 'Plus anciens', 'Più vecchi'],
  ['common.sortPriority', '优先级', 'Priority', 'Priorität', 'Prioriteit', 'Prioridad', 'Priorité', 'Priorità'],
  ['common.sortDue', '首响到期', 'First response due', 'Erstreaktion fällig', 'Eerste reactie vervalt', 'Primera respuesta vence', 'Échéance première réponse', 'Scadenza prima risposta'],
  // 状态
  ['status.new', '新建', 'New', 'Neu', 'Nieuw', 'Nuevo', 'Nouveau', 'Nuovo'],
  ['status.awaiting_review', '待人工复核', 'Awaiting review', 'Prüfung ausstehend', 'Wacht op beoordeling', 'Pendiente de revisión', 'En attente de revue', 'In attesa di verifica'],
  ['status.waiting_customer', '待客户补充', 'Waiting for customer', 'Warten auf Kunde', 'Wacht op klant', 'Esperando al cliente', 'En attente du client', 'In attesa del cliente'],
  ['status.assigned', '已分派', 'Assigned', 'Zugewiesen', 'Toegewezen', 'Asignado', 'Assigné', 'Assegnato'],
  ['status.in_progress', '处理中', 'In progress', 'In Bearbeitung', 'In behandeling', 'En curso', 'En cours', 'In corso'],
  ['status.waiting_parts', '待备件', 'Waiting for parts', 'Warten auf Teile', 'Wacht op onderdelen', 'Esperando piezas', 'En attente de pièces', 'In attesa di ricambi'],
  ['status.waiting_visit', '待上门', 'Waiting for visit', 'Warten auf Termin', 'Wacht op bezoek', 'Esperando visita', 'En attente de visite', 'In attesa di visita'],
  ['status.escalated', '已升级', 'Escalated', 'Eskaliert', 'Geëscaleerd', 'Escalado', 'Escaladé', 'Escalation'],
  ['status.resolved', '已解决待确认', 'Resolved, pending confirmation', 'Gelöst, Bestätigung offen', 'Opgelost, bevestiging open', 'Resuelto, pendiente', 'Résolu, à confirmer', 'Risolto, da confermare'],
  ['status.closed', '已关闭', 'Closed', 'Geschlossen', 'Gesloten', 'Cerrado', 'Clôturé', 'Chiuso'],
  ['status.cancelled', '已取消', 'Cancelled', 'Storniert', 'Geannuleerd', 'Cancelado', 'Annulé', 'Annullato'],
  ['status.merged', '已合并', 'Merged', 'Zusammengeführt', 'Samengevoegd', 'Fusionado', 'Fusionné', 'Unito'],
  ['status.reopened', '重新打开', 'Reopened', 'Wieder geöffnet', 'Heropend', 'Reabierto', 'Rouvert', 'Riaperto'],
  // 优先级
  ['priority.P0', 'P0 安全紧急', 'P0 Safety emergency', 'P0 Sicherheitsnotfall', 'P0 Veiligheidsnoodgeval', 'P0 Emergencia de seguridad', 'P0 Urgence sécurité', 'P0 Emergenza sicurezza'],
  ['priority.P1', 'P1 高优先级', 'P1 High', 'P1 Hoch', 'P1 Hoog', 'P1 Alta', 'P1 Élevée', 'P1 Alta'],
  ['priority.P2', 'P2 一般故障', 'P2 Normal fault', 'P2 Normale Störung', 'P2 Normale storing', 'P2 Fallo normal', 'P2 Panne normale', 'P2 Guasto normale'],
  ['priority.P3', 'P3 普通咨询', 'P3 General inquiry', 'P3 Allgemeine Anfrage', 'P3 Algemene vraag', 'P3 Consulta general', 'P3 Demande générale', 'P3 Richiesta generale'],
  ['priority.none', '待判定', 'Not assessed', 'Nicht bewertet', 'Niet beoordeeld', 'Sin evaluar', 'Non évalué', 'Non valutato'],
  // 风险
  ['risk.queued', '待人工接管', 'Awaiting takeover', 'Übernahme ausstehend', 'Wacht op overname', 'Pendiente de asunción', 'Prise en charge en attente', 'In attesa di presa in carico'],
  ['risk.taken_over', '人工已接管', 'Taken over', 'Übernommen', 'Overgenomen', 'Asumido', 'Pris en charge', 'Preso in carico'],
  ['risk.mitigated', '风险已记录缓解', 'Mitigated', 'Entschärft', 'Afgezwakt', 'Mitigado', 'Atténué', 'Mitigato'],
  // 语言
  ['language.zh', '中文', 'Chinese', 'Chinesisch', 'Chinees', 'Chino', 'Chinois', 'Cinese'],
  ['language.en', '英语', 'English', 'Englisch', 'Engels', 'Inglés', 'Anglais', 'Inglese'],
  ['language.de', '德语', 'German', 'Deutsch', 'Duits', 'Alemán', 'Allemand', 'Tedesco'],
  ['language.nl', '荷兰语', 'Dutch', 'Niederländisch', 'Nederlands', 'Neerlandés', 'Néerlandais', 'Olandese'],
  ['language.es', '西班牙语', 'Spanish', 'Spanisch', 'Spaans', 'Español', 'Espagnol', 'Spagnolo'],
  ['language.fr', '法语', 'French', 'Französisch', 'Frans', 'Francés', 'Français', 'Francese'],
  ['language.it', '意大利语', 'Italian', 'Italienisch', 'Italiaans', 'Italiano', 'Italien', 'Italiano'],
  // 国家
  ['country.DE', '德国', 'Germany', 'Deutschland', 'Duitsland', 'Alemania', 'Allemagne', 'Germania'],
  ['country.NL', '荷兰', 'Netherlands', 'Niederlande', 'Nederland', 'Países Bajos', 'Pays-Bas', 'Paesi Bassi'],
  ['country.ES', '西班牙', 'Spain', 'Spanien', 'Spanje', 'España', 'Espagne', 'Spagna'],
  ['country.GB', '英国', 'United Kingdom', 'Vereinigtes Königreich', 'Verenigd Koninkrijk', 'Reino Unido', 'Royaume-Uni', 'Regno Unito'],
  ['country.AU', '澳大利亚', 'Australia', 'Australien', 'Australië', 'Australia', 'Australie', 'Australia'],
  ['country.CN', '中国', 'China', 'China', 'China', 'China', 'Chine', 'Cina'],
  ['country.FR', '法国', 'France', 'Frankreich', 'Frankrijk', 'Francia', 'France', 'Francia'],
  ['country.IT', '意大利', 'Italy', 'Italien', 'Italië', 'Italia', 'Italie', 'Italia'],
  // 类别
  ['category.connectivity', '设备联网与离线', 'Device connectivity & offline', 'Geräteverbindung & offline', 'Connectiviteit & offline', 'Conectividad y desconexión', 'Connectivité et hors ligne', 'Connettività e offline'],
  ['category.charging', '无法充电或放电', 'Charging & discharging', 'Laden & Entladen', 'Laden en ontladen', 'Carga y descarga', 'Charge et décharge', 'Ricarica e scarica'],
  ['category.monitoring', '数据展示与统计异常', 'Data display & statistics', 'Datenanzeige & Statistik', 'Gegevensweergave & statistieken', 'Visualización y estadísticas', 'Affichage et statistiques', 'Visualizzazione e statistiche'],
  ['category.backup', '备用供电问题', 'Backup power', 'Notstromversorgung', 'Noodstroom', 'Alimentación de respaldo', 'Alimentation de secours', 'Alimentazione di backup'],
  ['category.commissioning', '安装与调试', 'Installation & commissioning', 'Installation & Inbetriebnahme', 'Installatie & inbedrijfstelling', 'Instalación y puesta en marcha', 'Installation et mise en service', 'Installazione e messa in servizio'],
  ['category.alarm', '设备告警待排查', 'Device alarms', 'Gerätealarme', 'Apparaatmeldingen', 'Alarmas del equipo', 'Alarmes de l’appareil', 'Allarmi del dispositivo'],
  ['category.performance', '运行效果与收益疑问', 'Performance & yield', 'Leistung & Ertrag', 'Prestaties & opbrengst', 'Rendimiento y producción', 'Performance et rendement', 'Prestazioni e resa'],
  ['category.account', '账号与授权', 'Account & authorization', 'Konto & Berechtigung', 'Account & autorisatie', 'Cuenta y autorización', 'Compte et autorisation', 'Account e autorizzazione'],
  ['category.warranty', '保修与退换咨询', 'Warranty & returns', 'Garantie & Rückgabe', 'Garantie & retour', 'Garantía y devoluciones', 'Garantie et retour', 'Garanzia e reso'],
  ['category.cooling', '工商业温控问题', 'Commercial cooling', 'Gewerbliche Kühlung', 'Commerciële koeling', 'Refrigeración comercial', 'Refroidissement commercial', 'Raffreddamento commerciale'],
  ['category.dispatch', '项目通信与调度', 'Project communication', 'Projektkommunikation', 'Projectcommunicatie', 'Comunicación del proyecto', 'Communication projet', 'Comunicazione di progetto'],
  ['category.ev', '充电桩问题', 'EV charger', 'Wallbox', 'Laadpaal', 'Cargador VE', 'Borne de recharge', 'Colonnina di ricarica'],
  ['category.safety', '安全风险报告', 'Safety risk', 'Sicherheitsrisiko', 'Veiligheidsrisico', 'Riesgo de seguridad', 'Risque de sécurité', 'Rischio di sicurezza'],
  ['category.unknown', '无法判断，需要人工', 'Needs manual triage', 'Manuelle Prüfung', 'Handmatige beoordeling', 'Revisión manual', 'Revue manuelle', 'Verifica manuale'],
  // 表头
  ['col.ticket', '工单', 'Ticket', 'Ticket', 'Ticket', 'Ticket', 'Ticket', 'Ticket'],
  ['col.summary', '摘要', 'Summary', 'Zusammenfassung', 'Samenvatting', 'Resumen', 'Résumé', 'Riepilogo'],
  ['col.customer', '客户', 'Customer', 'Kunde', 'Klant', 'Cliente', 'Client', 'Cliente'],
  ['col.countryLang', '国家 / 语言', 'Country / language', 'Land / Sprache', 'Land / taal', 'País / idioma', 'Pays / langue', 'Paese / lingua'],
  ['col.category', '类别', 'Category', 'Kategorie', 'Categorie', 'Categoría', 'Catégorie', 'Categoria'],
  ['col.priority', '优先级', 'Priority', 'Priorität', 'Prioriteit', 'Prioridad', 'Priorité', 'Priorità'],
  ['col.status', '状态', 'Status', 'Status', 'Status', 'Estado', 'Statut', 'Stato'],
  ['col.owner', '负责人', 'Owner', 'Bearbeiter', 'Eigenaar', 'Responsable', 'Responsable', 'Responsabile'],
  ['col.missing', '缺失资料', 'Missing data', 'Fehlende Daten', 'Ontbrekende gegevens', 'Datos faltantes', 'Données manquantes', 'Dati mancanti'],
  ['col.firstResponse', '首次人工响应', 'First human response', 'Erste menschliche Antwort', 'Eerste menselijke reactie', 'Primera respuesta humana', 'Première réponse humaine', 'Prima risposta umana'],
  ['col.updated', '更新', 'Updated', 'Aktualisiert', 'Bijgewerkt', 'Actualizado', 'Mis à jour', 'Aggiornato'],
  ['col.takeover', '接管状态', 'Takeover', 'Übernahme', 'Overname', 'Asunción', 'Prise en charge', 'Presa in carico'],
  ['col.detected', '发现时间', 'Detected', 'Erkannt', 'Ontdekt', 'Detectado', 'Détecté', 'Rilevato'],
  ['col.waiting', '等待', 'Waiting', 'Warten', 'Wachten', 'Espera', 'Attente', 'Attesa'],
  ['col.overdue', '已超时', 'Overdue', 'Überfällig', 'Te laat', 'Vencido', 'En retard', 'Scaduto'],
  ['col.action', '操作', 'Action', 'Aktion', 'Actie', 'Acción', 'Action', 'Azione'],
  ['col.evidence', '风险证据 / 摘要', 'Risk evidence / summary', 'Risikonachweis / Zusammenfassung', 'Risicobewijs / samenvatting', 'Evidencia / resumen', 'Preuve / résumé', 'Evidenza / riepilogo'],
  ['col.summaryCustomer', '摘要 / 客户', 'Summary / customer', 'Zusammenfassung / Kunde', 'Samenvatting / klant', 'Resumen / cliente', 'Résumé / client', 'Riepilogo / cliente'],
  ['col.responsibleTeam', '责任团队', 'Responsible team', 'Verantwortliches Team', 'Verantwoordelijk team', 'Equipo responsable', 'Équipe responsable', 'Team responsabile'],
  // 总览
  ['dash.title', '服务总览', 'Service overview', 'Serviceübersicht', 'Serviceoverzicht', 'Resumen de servicio', 'Vue d’ensemble', 'Panoramica servizio'],
  ['dash.desc', '先处理风险与超时，再看积压与分布。所有数字按当前内存数据实时重算，冻结演示时钟 2026-10-24 12:00（UTC+8）。', 'Handle risk and SLA first, then backlog and distribution. All figures recalculate from in-memory data; frozen demo clock 2026-10-24 12:00 (UTC+8).', 'Zuerst Risiken und SLA, dann Rückstand und Verteilung. Alle Zahlen werden live aus den Speicherdaten berechnet; eingefrorene Demo-Uhr 2026-10-24 12:00 (UTC+8).', 'Eerst risico en SLA, dan achterstand en verdeling. Alle cijfers worden live uit geheugendata berekend; bevroren demoklok 2026-10-24 12:00 (UTC+8).', 'Primero riesgo y SLA; después acumulación y distribución. Todas las cifras se recalculan en memoria; reloj demo congelado 2026-10-24 12:00 (UTC+8).', 'D’abord les risques et SLA, puis l’arriéré et la répartition. Tous les chiffres sont recalculés en mémoire ; horloge démo figée 2026-10-24 12:00 (UTC+8).', 'Prima rischi e SLA, poi arretrato e distribuzione. Tutti i valori sono ricalcolati in memoria; orologio demo congelato 2026-10-24 12:00 (UTC+8).'],
  ['dash.viewRisk', '查看待接管风险', 'View risks awaiting takeover', 'Risiken zur Übernahme', 'Risico’s voor overname', 'Ver riesgos pendientes', 'Voir les risques à prendre en charge', 'Vedi rischi da prendere in carico'],
  ['dash.enterReview', '进入复核队列', 'Open review queue', 'Prüfwarteschlange öffnen', 'Beoordelingswachtrij openen', 'Abrir cola de revisión', 'Ouvrir la file de revue', 'Apri coda di verifica'],
  ['dash.total', '全量工单', 'All tickets', 'Alle Tickets', 'Alle tickets', 'Todos los tickets', 'Tous les tickets', 'Tutti i ticket'],
  ['dash.unresolved', '未解决积压', 'Unresolved backlog', 'Offener Rückstand', 'Openstaande achterstand', 'Pendientes sin resolver', 'Arriéré non résolu', 'Arretrato aperto'],
  ['dash.riskOpen', '风险未解除', 'Open risks', 'Offene Risiken', 'Open risico’s', 'Riesgos abiertos', 'Risques ouverts', 'Rischi aperti'],
  ['dash.review', '待人工复核', 'Awaiting review', 'Prüfung ausstehend', 'Wacht op beoordeling', 'Pendiente de revisión', 'En attente de revue', 'In attesa di verifica'],
  ['dash.unassigned', '无确认负责人', 'No confirmed owner', 'Kein bestätigter Bearbeiter', 'Geen bevestigde eigenaar', 'Sin responsable confirmado', 'Aucun responsable confirmé', 'Nessun responsabile confermato'],
  ['dash.firstOverdue', '首响超时', 'First response overdue', 'Erstreaktion überfällig', 'Eerste reactie te laat', 'Primera respuesta vencida', 'Première réponse en retard', 'Prima risposta scaduta'],
  ['dash.riskTitle', '当前风险与异常', 'Current risks & exceptions', 'Aktuelle Risiken & Ausnahmen', 'Huidige risico’s & uitzonderingen', 'Riesgos e incidencias actuales', 'Risques et exceptions en cours', 'Rischi ed eccezioni attuali'],
  ['dash.riskSub', '待接管优先，不以绿色分派代替接管事实', 'Takeover first; assignment is not takeover', 'Übernahme zuerst; Zuweisung ist keine Übernahme', 'Overname eerst; toewijzing is geen overname', 'Primero la asunción; asignar no es asumir', 'Prise en charge d’abord ; assigner n’est pas prendre en charge', 'Prima la presa in carico; assegnare non è prendere in carico'],
  ['dash.todoTitle', '我的待办', 'My tasks', 'Meine Aufgaben', 'Mijn taken', 'Mis tareas', 'Mes tâches', 'Le mie attività'],
  ['dash.todoSub', '复核 · 派工 · 接管', 'Review · dispatch · takeover', 'Prüfen · zuweisen · übernehmen', 'Beoordelen · toewijzen · overnemen', 'Revisar · asignar · asumir', 'Revue · assignation · prise en charge', 'Verifica · assegnazione · presa in carico'],
  ['dash.statusDist', '状态分布', 'Status distribution', 'Statusverteilung', 'Statusverdeling', 'Distribución por estado', 'Répartition par statut', 'Distribuzione per stato'],
  ['dash.countryDist', '国家分布', 'Country distribution', 'Länderverteilung', 'Landenverdeling', 'Distribución por país', 'Répartition par pays', 'Distribuzione per paese'],
  ['dash.categoryDist', '问题类别 Top 9', 'Top 9 categories', 'Top 9 Kategorien', 'Top 9 categorieën', 'Top 9 categorías', 'Top 9 catégories', 'Top 9 categorie'],
  ['dash.oldest', '积压最久的未解决工单', 'Oldest unresolved tickets', 'Älteste offene Tickets', 'Langst openstaande tickets', 'Tickets sin resolver más antiguos', 'Tickets non résolus les plus anciens', 'Ticket aperti più vecchi'],
  ['dash.sla', '时效与口径', 'SLA & definitions', 'SLA & Definitionen', 'SLA & definities', 'SLA y criterios', 'SLA et définitions', 'SLA e criteri'],
  ['dash.todoEmpty', '没有待办', 'No tasks', 'Keine Aufgaben', 'Geen taken', 'Sin tareas', 'Aucune tâche', 'Nessuna attività'],
  // 工单中心
  ['tickets.title', '工单中心', 'Ticket center', 'Ticket-Center', 'Ticketcentrum', 'Centro de tickets', 'Centre des tickets', 'Centro ticket'],
  ['tickets.desc', '按风险优先、到期紧迫与创建时间排序；筛选条件保留在 URL，可从看板与待办下钻。默认不把“待判定”优先级混入 P0—P3。', 'Sorted by risk, urgency and creation time; filters stay in the URL and support drill-down. “Not assessed” is kept out of P0—P3.', 'Sortiert nach Risiko, Dringlichkeit und Erstellung; Filter bleiben in der URL. „Nicht bewertet“ wird nicht zu P0—P3 gezählt.', 'Gesorteerd op risico, urgentie en aanmaakdatum; filters blijven in de URL. „Niet beoordeeld“ valt buiten P0—P3.', 'Ordenado por riesgo, urgencia y creación; los filtros quedan en la URL. «Sin evaluar» no se mezcla con P0—P3.', 'Trié par risque, urgence et création ; les filtres restent dans l’URL. « Non évalué » reste hors P0—P3.', 'Ordinati per rischio, urgenza e creazione; i filtri restano nell’URL. «Non valutato» resta fuori da P0—P3.'],
  ['tickets.emptyTitle', '没有符合条件的工单', 'No matching tickets', 'Keine passenden Tickets', 'Geen passende tickets', 'No hay tickets coincidentes', 'Aucun ticket correspondant', 'Nessun ticket corrispondente'],
  ['tickets.emptyHint', '请调整筛选条件，或清空筛选查看全部 492 条模拟工单。', 'Adjust the filters, or clear them to see all 492 simulated tickets.', 'Filter anpassen oder löschen, um alle 492 simulierten Tickets zu sehen.', 'Pas filters aan of wis ze om alle 492 gesimuleerde tickets te zien.', 'Ajusta o limpia los filtros para ver los 492 tickets simulados.', 'Ajustez ou effacez les filtres pour voir les 492 tickets simulés.', 'Modifica o cancella i filtri per vedere tutti i 492 ticket simulati.'],
  ['tickets.fieldHelp', '列表字段：工单编号与摘要、国家/语言、类别、优先级、状态、负责团队与人员、缺失资料、首次人工响应时效、最近更新。风险待接管的工单以红色左侧标记与「待接管」文字同时提示，不仅依赖颜色。', 'Columns: ticket and summary, country/language, category, priority, status, team and owner, missing data, first human response, last update. Risk tickets use a red marker plus the text “Awaiting takeover”, never colour alone.', 'Spalten: Ticket und Zusammenfassung, Land/Sprache, Kategorie, Priorität, Status, Team und Bearbeiter, fehlende Daten, erste menschliche Antwort, letzte Aktualisierung. Risiken nutzen roten Marker plus Text, nie nur Farbe.', 'Kolommen: ticket en samenvatting, land/taal, categorie, prioriteit, status, team en eigenaar, ontbrekende gegevens, eerste menselijke reactie, laatste update. Risico’s krijgen een rode markering plus tekst, nooit alleen kleur.', 'Columnas: ticket y resumen, país/idioma, categoría, prioridad, estado, equipo y responsable, datos faltantes, primera respuesta humana, última actualización. Los riesgos usan marca roja y texto, nunca solo color.', 'Colonnes : ticket et résumé, pays/langue, catégorie, priorité, statut, équipe et responsable, données manquantes, première réponse humaine, dernière mise à jour. Les risques utilisent un repère rouge et un texte, jamais la couleur seule.', 'Colonne: ticket e riepilogo, paese/lingua, categoria, priorità, stato, team e responsabile, dati mancanti, prima risposta umana, ultimo aggiornamento. I rischi usano un indicatore rosso e testo, mai solo colore.'],
  // 风险页
  ['riskPage.title', '风险与超时', 'Risk & SLA', 'Risiko & SLA', 'Risico & SLA', 'Riesgo y SLA', 'Risques et SLA', 'Rischi e SLA'],
  ['riskPage.desc', '把“已提示、已入队、人工已接管”分开记录。风险待接管不因缺少 SN 或普通复核流程而延误；超时按冻结演示时钟严格计算。', '“Flagged, queued, taken over” are recorded separately. Missing SN or normal review never blocks risk handover; SLA uses the frozen demo clock.', '„Gemeldet, eingereiht, übernommen“ wird getrennt erfasst. Fehlende SN oder normale Prüfung blockieren die Übernahme nicht; SLA nach eingefrorener Demo-Uhr.', '„Gemeldet, in wachtrij, overgenomen“ wordt apart vastgelegd. Ontbrekende SN of normale beoordeling blokkeert overname niet; SLA volgens bevroren demoklok.', '«Avisado, en cola, asumido» se registra por separado. La falta de SN o la revisión normal no bloquean la asunción; SLA con reloj demo congelado.', '« Signalé, en file, pris en charge » sont distincts. L’absence de SN ou une revue normale ne bloque pas la prise en charge ; SLA selon l’horloge démo figée.', '«Segnalato, in coda, preso in carico» sono distinti. SN mancante o verifica normale non bloccano la presa in carico; SLA con orologio demo congelato.'],
  ['riskPage.viewRisk', '当前风险', 'Current risks', 'Aktuelle Risiken', 'Huidige risico’s', 'Riesgos actuales', 'Risques actuels', 'Rischi attuali'],
  ['riskPage.viewPending', '待人工接管', 'Awaiting takeover', 'Übernahme ausstehend', 'Wacht op overname', 'Pendiente de asunción', 'Prise en charge en attente', 'In attesa di presa in carico'],
  ['riskPage.viewFirst', '待首响超时', 'First response overdue', 'Erstreaktion überfällig', 'Eerste reactie te laat', 'Primera respuesta vencida', 'Première réponse en retard', 'Prima risposta scaduta'],
  ['riskPage.viewResolution', '普通解决目标超时', 'Resolution target overdue', 'Lösungsziel überfällig', 'Oplossingsdoel te laat', 'Objetivo de resolución vencido', 'Objectif de résolution en retard', 'Obiettivo di risoluzione scaduto'],
  ['riskPage.listTitle', '风险清单', 'Risk list', 'Risikoliste', 'Risicolijst', 'Lista de riesgos', 'Liste des risques', 'Elenco rischi'],
  ['riskPage.listSub', '待接管置顶；红色标记并附文字', 'Awaiting takeover first; red marker plus text', 'Übernahme zuerst; roter Marker plus Text', 'Overname eerst; rode markering plus tekst', 'Asunción primero; marca roja y texto', 'Prise en charge d’abord ; repère rouge et texte', 'Presa in carico prima; indicatore rosso e testo'],
  ['riskPage.empty', '当前没有未解除风险', 'No open risks', 'Keine offenen Risiken', 'Geen open risico’s', 'No hay riesgos abiertos', 'Aucun risque ouvert', 'Nessun rischio aperto'],
  ['riskPage.note', '口径说明：当前风险 = 风险记录未记录缓解且工单未解决；待人工接管 = 风险记录仍为 queued；首响超时 = 未解决、无客户可见人工回复且当前时间严格大于首响到期时间。接管、回复与修复是三件不同的事。', 'Definitions: current risk = risk not mitigated and ticket unresolved; awaiting takeover = risk still queued; first response overdue = unresolved, no customer-visible human reply and now strictly after due time. Takeover, reply and fix are different.', 'Definitionen: aktuelles Risiko = nicht entschärft und Ticket offen; Übernahme ausstehend = Risiko noch in Warteschlange; Erstreaktion überfällig = offen, keine sichtbare Antwort und jetzt strikt nach Fälligkeit. Übernahme, Antwort und Behebung sind verschieden.', 'Definities: huidig risico = niet afgezwakt en ticket open; wacht op overname = risico nog in wachtrij; eerste reactie te laat = open, geen zichtbaar antwoord en nu strikt na vervaldatum. Overname, antwoord en oplossing zijn verschillend.', 'Definiciones: riesgo actual = no mitigado y ticket abierto; pendiente de asunción = riesgo en cola; primera respuesta vencida = abierto, sin respuesta visible y ahora estrictamente después del vencimiento. Asunción, respuesta y reparación son distintas.', 'Définitions : risque actuel = non atténué et ticket ouvert ; en attente de prise en charge = encore en file ; première réponse en retard = ouvert, sans réponse visible et maintenant strictement après l’échéance. Prise en charge, réponse et réparation sont distinctes.', 'Definizioni: rischio attuale = non mitigato e ticket aperto; in attesa di presa in carico = ancora in coda; prima risposta scaduta = aperto, nessuna risposta visibile e ora strettamente dopo la scadenza. Presa in carico, risposta e riparazione sono distinte.'],
  // 详情
  ['detail.tabOverview', '概览', 'Overview', 'Übersicht', 'Overzicht', 'Resumen', 'Vue d’ensemble', 'Panoramica'],
  ['detail.tabConversation', '原始反馈与对话', 'Original & conversation', 'Original & Verlauf', 'Origineel & gesprek', 'Original y conversación', 'Original et conversation', 'Originale e conversazione'],
  ['detail.tabReview', 'AI 分诊复核', 'AI triage review', 'KI-Triage prüfen', 'AI-triage beoordelen', 'Revisión de triaje IA', 'Revue de triage IA', 'Verifica triage AI'],
  ['detail.tabDispatch', '派工与协同', 'Dispatch & collaboration', 'Zuweisung & Zusammenarbeit', 'Toewijzing & samenwerking', 'Asignación y colaboración', 'Assignation et collaboration', 'Assegnazione e collaborazione'],
  ['detail.tabHandling', '处理与结案', 'Handling & closure', 'Bearbeitung & Abschluss', 'Behandeling & afsluiting', 'Gestión y cierre', 'Traitement et clôture', 'Gestione e chiusura'],
  ['detail.tabTimeline', '时间线', 'Timeline', 'Zeitachse', 'Tijdlijn', 'Cronología', 'Chronologie', 'Cronologia'],
  ['detail.back', '返回列表', 'Back to list', 'Zur Liste', 'Terug naar lijst', 'Volver a la lista', 'Retour à la liste', 'Torna all’elenco'],
  ['detail.escalate', '转人工风险处理', 'Escalate to human risk handling', 'An menschliche Risikobearbeitung', 'Naar menselijke risicobehandeling', 'Escalar a gestión humana de riesgo', 'Escalader vers le traitement humain', 'Invia a gestione umana del rischio'],
  ['detail.closeReopen', '重开 / 结案', 'Reopen / close', 'Wieder öffnen / schließen', 'Heropenen / sluiten', 'Reabrir / cerrar', 'Rouvrir / clôturer', 'Riapri / chiudi'],
  ['detail.reviewBtn', '核对并确认建议', 'Review and confirm', 'Prüfen und bestätigen', 'Beoordelen en bevestigen', 'Revisar y confirmar', 'Vérifier et confirmer', 'Verifica e conferma'],
  ['detail.originalFeedback', '原始反馈', 'Original feedback', 'Ursprüngliche Meldung', 'Oorspronkelijke melding', 'Comentario original', 'Retour original', 'Segnalazione originale'],
  ['detail.aiSuggestion', 'AI 分诊建议', 'AI triage suggestion', 'KI-Triagevorschlag', 'AI-triagesuggestie', 'Sugerencia de triaje IA', 'Suggestion de triage IA', 'Suggerimento di triage AI'],
  ['detail.recent', '最近沟通', 'Recent conversation', 'Letzter Verlauf', 'Recent gesprek', 'Conversación reciente', 'Conversation récente', 'Conversazione recente'],
  ['detail.outcome', '当前结果与待确认项', 'Outcome & open items', 'Ergebnis & offene Punkte', 'Resultaat & open punten', 'Resultado y pendientes', 'Résultat et points ouverts', 'Esito e punti aperti'],
  ['detail.reviewForm', '逐项核对与修改', 'Item-by-item review', 'Einzeln prüfen und ändern', 'Item voor item beoordelen', 'Revisión punto por punto', 'Vérification point par point', 'Verifica punto per punto'],
  ['detail.progressSection', '推进处理状态', 'Advance handling status', 'Bearbeitungsstatus ändern', 'Behandelstatus wijzigen', 'Avanzar estado de gestión', 'Faire avancer le statut', 'Avanza stato gestione'],
  ['detail.resolveSection', '解决与关闭', 'Resolve & close', 'Lösen & schließen', 'Oplossen & sluiten', 'Resolver y cerrar', 'Résoudre et clôturer', 'Risolvi e chiudi'],
  ['detail.duplicateSection', '重复、复发与重开', 'Duplicates, recurrence & reopen', 'Duplikate, Wiederauftreten & erneut öffnen', 'Duplicaten, herhaling & heropenen', 'Duplicados, recurrencia y reapertura', 'Doublons, récidive et réouverture', 'Duplicati, recidiva e riapertura'],
  ['detail.riskSection', '风险与应急接管', 'Risk & emergency takeover', 'Risiko & Notfallübernahme', 'Risico & noodoverame', 'Riesgo y asunción de emergencia', 'Risque et prise en charge d’urgence', 'Rischio e presa in carico di emergenza'],
  ['detail.relatedTickets', '关联工单', 'Related tickets', 'Verknüpfte Tickets', 'Gerelateerde tickets', 'Tickets relacionados', 'Tickets liés', 'Ticket correlati'],
  ['detail.timelineHeading', '处理时间线', 'Handling timeline', 'Bearbeitungszeitachse', 'Behandeltijdlijn', 'Cronología de gestión', 'Chronologie du traitement', 'Cronologia di gestione'],
  ['detail.timelineHint', '按发生顺序追加；预约未来时间只出现在资源提案中。', 'Appended in order; future appointments appear only in resource proposals.', 'In Reihenfolge ergänzt; zukünftige Termine nur in Ressourcenvorschlägen.', 'In volgorde toegevoegd; toekomstige afspraken alleen in middelenvoorstellen.', 'Se añade por orden; las citas futuras solo aparecen en propuestas de recursos.', 'Ajouté dans l’ordre ; les rendez-vous futurs figurent seulement dans les propositions.', 'Aggiunto in ordine; gli appuntamenti futuri compaiono solo nelle proposte.'],
  ['detail.dispatchHeading', '确认派工与资源协同', 'Confirm dispatch & resources', 'Zuweisung & Ressourcen bestätigen', 'Toewijzing & middelen bevestigen', 'Confirmar asignación y recursos', 'Confirmer l’assignation et les ressources', 'Conferma assegnazione e risorse'],
  ['detail.dispatchIntro', '按设备所在国家、所需技能、语言与当前负载核对；未确认的建议不会写入负责人。', 'Check country, skills, languages and current load; suggestions do not become the owner until confirmed.', 'Land, Skills, Sprachen und Auslastung prüfen; Vorschläge werden erst nach Bestätigung zum Bearbeiter.', 'Controleer land, skills, talen en belasting; suggesties worden pas na bevestiging eigenaar.', 'Comprueba país, capacidades, idiomas y carga; la sugerencia no es responsable hasta confirmar.', 'Vérifiez pays, compétences, langues et charge ; une suggestion ne devient responsable qu’après confirmation.', 'Verifica paese, competenze, lingue e carico; un suggerimento diventa responsabile solo dopo conferma.'],
  ['detail.candidateTeams', '候选团队', 'Candidate teams', 'Kandidatenteams', 'Kandidaatteams', 'Equipos candidatos', 'Équipes candidates', 'Team candidati'],
  ['detail.agentsLoad', '团队人员与负载', 'Team members & load', 'Team und Auslastung', 'Teamleden en belasting', 'Miembros y carga', 'Membres et charge', 'Membri e carico'],
  ['detail.availability', '可用性', 'Availability', 'Verfügbarkeit', 'Beschikbaarheid', 'Disponibilidad', 'Disponibilité', 'Disponibilità'],
  ['detail.load', '负载', 'Load', 'Auslastung', 'Belasting', 'Carga', 'Charge', 'Carico'],
  ['detail.handoverNote', '交接说明', 'Handover note', 'Übergabehinweis', 'Overdrachtsnotitie', 'Nota de traspaso', 'Note de passation', 'Nota di passaggio'],
  ['detail.dispatchHistory', '分派历史', 'Assignment history', 'Zuweisungsverlauf', 'Toewijzingsgeschiedenis', 'Historial de asignaciones', 'Historique des assignations', 'Cronologia assegnazioni'],
  ['detail.resources', '资源提案', 'Resource proposals', 'Ressourcenvorschläge', 'Middelenvoorstellen', 'Propuestas de recursos', 'Propositions de ressources', 'Proposte di risorse'],
  ['detail.noResources', '暂无备件或上门提案。', 'No parts or visit proposals.', 'Keine Teile- oder Terminvorschläge.', 'Geen onderdelen- of bezoekvoorstellen.', 'Sin propuestas de piezas o visita.', 'Aucune proposition de pièce ou visite.', 'Nessuna proposta di ricambi o visita.'],
  ['detail.currentStatus', '当前状态', 'Current status', 'Aktueller Status', 'Huidige status', 'Estado actual', 'Statut actuel', 'Stato attuale'],
  ['detail.btnStart', '开始处理', 'Start handling', 'Bearbeitung starten', 'Behandeling starten', 'Iniciar gestión', 'Démarrer le traitement', 'Avvia gestione'],
  ['detail.btnWaitCustomer', '等待客户补充', 'Wait for customer', 'Auf Kunden warten', 'Wacht op klant', 'Esperar al cliente', 'Attendre le client', 'Attendi il cliente'],
  ['detail.btnWaitParts', '记录备件需求', 'Request parts', 'Teile anfordern', 'Onderdelen aanvragen', 'Solicitar piezas', 'Demander des pièces', 'Richiedi ricambi'],
  ['detail.btnWaitVisit', '登记上门提案', 'Propose visit', 'Termin vorschlagen', 'Bezoek voorstellen', 'Proponer visita', 'Proposer une visite', 'Proponi visita'],
  ['detail.btnResolve', '标记已解决待确认', 'Mark resolved', 'Als gelöst markieren', 'Als opgelost markeren', 'Marcar resuelto', 'Marquer résolu', 'Segna risolto'],
  ['detail.btnClose', '确认关闭工单', 'Close ticket', 'Ticket schließen', 'Ticket sluiten', 'Cerrar ticket', 'Clôturer le ticket', 'Chiudi ticket'],
  ['detail.btnReopen', '重开并新建周期', 'Reopen with new cycle', 'Mit neuer Periode öffnen', 'Heropenen met nieuwe cyclus', 'Reabrir con nuevo ciclo', 'Rouvrir avec un nouveau cycle', 'Riapri con nuovo ciclo'],
  ['detail.btnTakeover', '确认人工接管', 'Confirm takeover', 'Übernahme bestätigen', 'Overname bevestigen', 'Confirmar asunción', 'Confirmer la prise en charge', 'Conferma presa in carico'],
  ['detail.btnMitigate', '记录风险缓解', 'Record mitigation', 'Entschärfung erfassen', 'Afzwakking vastleggen', 'Registrar mitigación', 'Enregistrer l’atténuation', 'Registra mitigazione'],
  ['detail.btnMerge', '人工确认合并', 'Confirm merge', 'Zusammenführung bestätigen', 'Samenvoegen bevestigen', 'Confirmar fusión', 'Confirmer la fusion', 'Conferma unione'],
  ['detail.btnConfirmDispatch', '确认派工', 'Confirm dispatch', 'Zuweisung bestätigen', 'Toewijzing bevestigen', 'Confirmar asignación', 'Confirmer l’assignation', 'Conferma assegnazione'],
  ['detail.btnReassign', '确认改派', 'Confirm reassignment', 'Umzuweisung bestätigen', 'Hertoewijzing bevestigen', 'Confirmar reasignación', 'Confirmer la réaffectation', 'Conferma riassegnazione'],
  ['detail.btnEscalate', '立即转人工风险处理', 'Escalate to human risk handling', 'An menschliche Risikobearbeitung', 'Naar menselijke risicobehandeling', 'Escalar a gestión humana', 'Escalader vers le traitement humain', 'Invia a gestione umana'],
  ['riskPage.panelTitle', '接管与处置', 'Takeover & handling', 'Übernahme & Bearbeitung', 'Overname & behandeling', 'Asunción y gestión', 'Prise en charge et traitement', 'Presa in carico e gestione'],
  ['riskPage.suspect', '疑似安全风险 · 需人工判断', 'Suspected safety risk · human review required', 'Vermutetes Sicherheitsrisiko · manuelle Prüfung', 'Vermoedelijk veiligheidsrisico · handmatige beoordeling', 'Posible riesgo de seguridad · revisión humana', 'Risque de sécurité suspect · revue humaine', 'Possibile rischio di sicurezza · verifica umana'],
  ['riskPage.ticket', '工单', 'Ticket', 'Ticket', 'Ticket', 'Ticket', 'Ticket', 'Ticket'],
  ['riskPage.customerSite', '客户 / 站点', 'Customer / site', 'Kunde / Standort', 'Klant / locatie', 'Cliente / sitio', 'Client / site', 'Cliente / sito'],
  ['riskPage.device', '设备', 'Device', 'Gerät', 'Apparaat', 'Equipo', 'Appareil', 'Dispositivo'],
  ['riskPage.team', '责任团队', 'Responsible team', 'Verantwortliches Team', 'Verantwoordelijk team', 'Equipo responsable', 'Équipe responsable', 'Team responsabile'],
  ['riskPage.detected', '发现时间', 'Detected', 'Erkannt', 'Ontdekt', 'Detectado', 'Détecté', 'Rilevato'],
  ['riskPage.source', '来源', 'Source', 'Quelle', 'Bron', 'Origen', 'Source', 'Origine'],
  ['riskPage.takeoverTime', '接管时间', 'Takeover time', 'Übernahmezeit', 'Overnametijd', 'Hora de asunción', 'Heure de prise en charge', 'Ora di presa in carico'],
  ['riskPage.nextUpdate', '下次更新', 'Next update', 'Nächste Aktualisierung', 'Volgende update', 'Próxima actualización', 'Prochaine mise à jour', 'Prossimo aggiornamento'],
  ['riskPage.originalDesc', '客户原始描述', 'Original customer report', 'Original-Kundenmeldung', 'Oorspronkelijke melding', 'Descripción original', 'Description originale', 'Descrizione originale'],
  ['riskPage.takeoverNote', '接管说明（必填）', 'Takeover note (required)', 'Übernahmehinweis (erforderlich)', 'Overname-notitie (verplicht)', 'Nota de asunción (obligatoria)', 'Note de prise en charge (obligatoire)', 'Nota di presa in carico (obbligatoria)'],
  ['riskPage.confirmTakeover', '确认人工接管', 'Confirm human takeover', 'Menschliche Übernahme bestätigen', 'Menselijke overname bevestigen', 'Confirmar asunción humana', 'Confirmer la prise en charge', 'Conferma presa in carico'],
  ['riskPage.mitigateNote', '风险缓解依据', 'Mitigation basis', 'Entschärfungsgrundlage', 'Basis voor afzwakking', 'Base de mitigación', 'Base d’atténuation', 'Base di mitigazione'],
  ['riskPage.recordMitigation', '记录风险缓解', 'Record mitigation', 'Entschärfung erfassen', 'Afzwakking vastleggen', 'Registrar mitigación', 'Enregistrer l’atténuation', 'Registra mitigazione'],
  ['riskPage.manualTitle', '手工转人工风险处理', 'Manual risk escalation', 'Manuelle Risikoeskalation', 'Handmatige risico-escalatie', 'Escalado manual de riesgo', 'Escalade manuelle du risque', 'Escalation manuale del rischio'],
  ['riskPage.manualReason', '升级原因 / 客户原话', 'Reason / customer words', 'Grund / Kundenaussage', 'Reden / klantwoorden', 'Motivo / palabras del cliente', 'Motif / mots du client', 'Motivo / parole del cliente'],
  ['riskPage.manualP0', '按 P0 安全紧急处理', 'Handle as P0 safety emergency', 'Als P0-Sicherheitsnotfall behandeln', 'Als P0-veiligheidsnoodgeval behandelen', 'Tratar como emergencia P0', 'Traiter comme urgence P0', 'Tratta come emergenza P0'],
  ['riskPage.manualSubmit', '立即升级并进入队列', 'Escalate and queue now', 'Sofort eskalieren und einreihen', 'Nu escaleren en in wachtrij', 'Escalar y encolar ahora', 'Escalader et mettre en file', 'Escala e metti in coda'],
  ['riskPage.notTakenOver', '尚无接管记录', 'No takeover record', 'Keine Übernahme erfasst', 'Geen overname vastgelegd', 'Sin registro de asunción', 'Aucune prise en charge', 'Nessuna presa in carico'],
  ['riskPage.takenOverBy', '接管人', 'Taken over by', 'Übernommen von', 'Overgenomen door', 'Asumido por', 'Pris en charge par', 'Preso in carico da'],
  ['riskPage.sourceSeed', '种子安全标记', 'Seed safety flag', 'Seed-Sicherheitsmarkierung', 'Seed-veiligheidsmarkering', 'Marca de seguridad seed', 'Marqueur de sécurité source', 'Flag di sicurezza seed'],
  ['riskPage.sourceManual', '人工升级', 'Manual escalation', 'Manuelle Eskalation', 'Handmatige escalatie', 'Escalado manual', 'Escalade manuelle', 'Escalation manuale'],
  ['riskPage.manualTicket', '工单编号', 'Ticket ID', 'Ticket-Nummer', 'Ticketnummer', 'ID del ticket', 'Numéro du ticket', 'ID ticket'],
  ['detail.reviewTitle', 'AI 分诊复核', 'AI triage review', 'KI-Triage prüfen', 'AI-triage beoordelen', 'Revisión de triaje IA', 'Revue de triage IA', 'Verifica triage AI'],
  ['detail.reviewIntro', '建议来自预设演示数据或演示规则，不是真实模型输出；确认建议不等于批准保修、关闭工单或操作设备。', 'Suggestions come from preset demo data or rules, not a real model. Confirming does not approve warranty, close the ticket or control devices.', 'Vorschläge stammen aus Demo-Daten oder Regeln, nicht aus einem echten Modell. Bestätigen genehmigt keine Garantie, schließt kein Ticket und steuert keine Geräte.', 'Suggesties komen uit demo-data of regels, niet uit een echt model. Bevestigen keurt geen garantie goed, sluit geen ticket en bestuurt geen apparaten.', 'Las sugerencias vienen de datos o reglas demo, no de un modelo real. Confirmar no aprueba garantía, no cierra el ticket ni controla equipos.', 'Les suggestions viennent de données ou règles démo, pas d’un modèle réel. Confirmer n’approuve pas la garantie, ne clôture pas le ticket et ne contrôle pas l’appareil.', 'I suggerimenti provengono da dati o regole demo, non da un modello reale. Confermare non approva la garanzia, non chiude il ticket e non controlla i dispositivi.'],
  ['detail.evidence', '原文证据', 'Source evidence', 'Quellennachweis', 'Bronsbewijs', 'Evidencia original', 'Preuve source', 'Evidenza originale'],
  ['detail.knowledge', '引用资料（只读）', 'Referenced material (read-only)', 'Referenzmaterial (schreibgeschützt)', 'Referentiemateriaal (alleen lezen)', 'Material citado (solo lectura)', 'Références (lecture seule)', 'Materiale citato (sola lettura)'],
  ['detail.manualReview', '人工复核记录', 'Human review record', 'Menschlicher Prüfeintrag', 'Menselijk beoordelingsrecord', 'Registro de revisión humana', 'Journal de revue humaine', 'Registro di verifica umana'],
  ['detail.reviewPending', '尚未人工复核。确认后将写入类别、优先级、团队建议与复核记录。', 'Not yet reviewed. Confirming writes category, priority, team suggestion and a review record.', 'Noch nicht geprüft. Bestätigen schreibt Kategorie, Priorität, Teamvorschlag und Prüfeintrag.', 'Nog niet beoordeeld. Bevestigen schrijft categorie, prioriteit, teamsuggestie en beoordeling weg.', 'Aún sin revisar. Confirmar guarda categoría, prioridad, equipo y registro.', 'Pas encore revu. Confirmer enregistre catégorie, priorité, équipe et journal.', 'Non ancora verificato. Confermando si salvano categoria, priorità, team e registro.'],
  ['detail.reviewCorrected', '人工更正', 'Corrected by human', 'Menschlich korrigiert', 'Menselijk gecorrigeerd', 'Corregido por humano', 'Corrigé par un humain', 'Corretto da umano'],
  ['detail.reviewAccepted', '人工确认', 'Confirmed by human', 'Menschlich bestätigt', 'Menselijk bevestigd', 'Confirmado por humano', 'Confirmé par un humain', 'Confermato da umano'],
  ['detail.reviewChanged', '已修改建议值。保存后原建议保留，修改值、操作者、时间与原因可追溯；不会覆盖 AI 原始建议。', 'Suggestion changed. Saving keeps the original plus changed value, actor, time and reason; the original AI suggestion is preserved.', 'Vorschlag geändert. Speichern behält Original, Änderung, Bearbeiter, Zeit und Grund; der ursprüngliche KI-Vorschlag bleibt erhalten.', 'Suggestie gewijzigd. Opslaan bewaart origineel, wijziging, gebruiker, tijd en reden; de oorspronkelijke AI-suggestie blijft.', 'Sugerencia modificada. Al guardar se conservan original, cambio, usuario, hora y motivo; la sugerencia original de IA se mantiene.', 'Suggestion modifiée. L’enregistrement conserve l’original, la modification, l’auteur, l’heure et le motif ; la suggestion IA d’origine reste.', 'Suggerimento modificato. Il salvataggio conserva originale, modifica, autore, ora e motivo; il suggerimento AI originale resta.'],
  ['detail.confirmReview', '确认原建议并进入派工', 'Confirm and go to dispatch', 'Bestätigen und zuweisen', 'Bevestigen en naar toewijzing', 'Confirmar e ir a asignación', 'Confirmer et assigner', 'Conferma e vai ad assegnazione'],
  ['detail.saveCorrection', '保存人工修改', 'Save correction', 'Korrektur speichern', 'Correctie opslaan', 'Guardar corrección', 'Enregistrer la correction', 'Salva correzione'],
  ['detail.toHuman', '转人工升级', 'Escalate to human', 'An Mensch eskalieren', 'Naar mens escaleren', 'Escalar a humano', 'Escalader à un humain', 'Invia a umano'],
  ['detail.preset', '预设演示建议', 'Preset demo suggestion', 'Vordefinierter Demo-Vorschlag', 'Vooraf ingestelde demo-suggestie', 'Sugerencia demo predefinida', 'Suggestion démo prédéfinie', 'Suggerimento demo predefinito'],
  ['detail.nextAction', '下一步', 'Next step', 'Nächster Schritt', 'Volgende stap', 'Siguiente paso', 'Étape suivante', 'Prossimo passo'],
  ['detail.statusLabel', '当前状态', 'Current status', 'Aktueller Status', 'Huidige status', 'Estado actual', 'Statut actuel', 'Stato attuale'],
  ['dash.pending', '待判定', 'Unassessed', 'Nicht bewertet', 'Niet beoordeeld', 'Sin evaluar', 'Non évalué', 'Non valutato'],
  ['detail.tabBadgeReview', '待复核', 'Review', 'Prüfen', 'Beoordelen', 'Revisar', 'À revoir', 'Da verificare'],
  ['detail.tabBadgeDispatch', '待派工', 'To dispatch', 'Zuzuweisen', 'Toewijzen', 'Por asignar', 'À assigner', 'Da assegnare'],
  ['detail.aiCategory', '建议类别', 'Suggested category', 'Vorgeschlagene Kategorie', 'Voorgestelde categorie', 'Categoría sugerida', 'Catégorie suggérée', 'Categoria suggerita'],
  ['detail.aiPriority', '建议优先级', 'Suggested priority', 'Vorgeschlagene Priorität', 'Voorgestelde prioriteit', 'Prioridad sugerida', 'Priorité suggérée', 'Priorità suggerita'],
  ['detail.aiTeam', '建议团队', 'Suggested team', 'Vorgeschlagenes Team', 'Voorgesteld team', 'Equipo sugerido', 'Équipe suggérée', 'Team suggerito'],
  ['detail.confidence', '置信度', 'Confidence', 'Konfidenz', 'Betrouwbaarheid', 'Confianza', 'Confiance', 'Affidabilità'],
  ['detail.riskEscalation', '风险升级', 'Risk escalation', 'Risikoeskalation', 'Risico-escalatie', 'Escalado de riesgo', 'Escalade du risque', 'Escalatione del rischio'],
  ['detail.evidenceCount', '证据数量', 'Evidence count', 'Anzahl Nachweise', 'Aantal bewijzen', 'Número de evidencias', 'Nombre de preuves', 'Numero di evidenze'],
  ['detail.formCategory', '问题类别', 'Issue category', 'Problemkategorie', 'Probleemcategorie', 'Categoría del problema', 'Catégorie du problème', 'Categoria del problema'],
  ['detail.formPriority', '优先级', 'Priority', 'Priorität', 'Prioriteit', 'Prioridad', 'Priorité', 'Priorità'],
  ['detail.formTeam', '建议负责团队', 'Suggested team', 'Vorgeschlagenes Team', 'Voorgesteld team', 'Equipo sugerido', 'Équipe suggérée', 'Team suggerito'],
  ['detail.formMissing', '缺失资料（只追问缺少项，不伪造字段）', 'Missing data (ask only for missing items)', 'Fehlende Daten (nur Fehlendes erfragen)', 'Ontbrekende gegevens (alleen ontbrekende vragen)', 'Datos faltantes (preguntar solo lo que falta)', 'Données manquantes (demander seulement le manquant)', 'Dati mancanti (chiedi solo ciò che manca)'],
  ['detail.formNote', '复核说明（修改时必须填写原因）', 'Review note (reason required when changed)', 'Prüfhinweis (Grund bei Änderung erforderlich)', 'Beoordelingsnotitie (reden verplicht bij wijziging)', 'Nota de revisión (motivo obligatorio si cambia)', 'Note de revue (motif requis en cas de modification)', 'Nota di verifica (motivo obbligatorio se modificato)'],
  ['rail.sla', '时效与等待', 'SLA & waiting', 'SLA & Wartezeit', 'SLA & wachttijd', 'SLA y espera', 'SLA et attente', 'SLA e attesa'],
  ['rail.start', '计时起点', 'Clock start', 'Startzeit', 'Starttijd', 'Inicio del reloj', 'Début du chrono', 'Avvio orologio'],
  ['rail.firstDue', '首响到期', 'First response due', 'Erstreaktion fällig', 'Eerste reactie vervalt', 'Vence primera respuesta', 'Échéance première réponse', 'Scadenza prima risposta'],
  ['rail.firstRecord', '首响记录', 'First response record', 'Erstreaktion erfasst', 'Eerste reactie vastgelegd', 'Registro de primera respuesta', 'Première réponse enregistrée', 'Prima risposta registrata'],
  ['rail.resolutionDue', '解决到期', 'Resolution due', 'Lösung fällig', 'Oplossing vervalt', 'Vence resolución', 'Échéance résolution', 'Scadenza risoluzione'],
  ['rail.wait', '等待时长', 'Waiting time', 'Wartezeit', 'Wachttijd', 'Tiempo de espera', 'Temps d’attente', 'Tempo di attesa'],
  ['rail.deviceCustomer', '设备与客户', 'Device & customer', 'Gerät & Kunde', 'Apparaat & klant', 'Equipo y cliente', 'Appareil et client', 'Dispositivo e cliente'],
  ['rail.product', '产品', 'Product', 'Produkt', 'Product', 'Producto', 'Produit', 'Prodotto'],
  ['rail.sn', 'SN', 'SN', 'SN', 'SN', 'SN', 'SN', 'SN'],
  ['rail.deviceId', '设备 ID', 'Device ID', 'Geräte-ID', 'Apparaat-ID', 'ID del equipo', 'ID appareil', 'ID dispositivo'],
  ['rail.installed', '装机日期', 'Installed on', 'Installiert am', 'Geïnstalleerd op', 'Instalado el', 'Installé le', 'Installato il'],
  ['rail.customer', '客户', 'Customer', 'Kunde', 'Klant', 'Cliente', 'Client', 'Cliente'],
  ['rail.site', '站点', 'Site', 'Standort', 'Locatie', 'Sitio', 'Site', 'Sito'],
  ['rail.timezone', '时区', 'Time zone', 'Zeitzone', 'Tijdzone', 'Zona horaria', 'Fuseau horaire', 'Fuso orario'],
  ['rail.warranty', '保修', 'Warranty', 'Garantie', 'Garantie', 'Garantía', 'Garantie', 'Garanzia'],
  ['rail.contact', '联系', 'Contact', 'Kontakt', 'Contact', 'Contacto', 'Contact', 'Contatto'],
  ['rail.responsibility', '责任与派工', 'Responsibility & dispatch', 'Verantwortung & Zuweisung', 'Verantwoordelijkheid & toewijzing', 'Responsabilidad y asignación', 'Responsabilité et assignation', 'Responsabilità e assegnazione'],
  ['rail.team', '负责团队', 'Responsible team', 'Verantwortliches Team', 'Verantwoordelijk team', 'Equipo responsable', 'Équipe responsable', 'Team responsabile'],
  ['rail.agent', '负责人', 'Owner', 'Bearbeiter', 'Eigenaar', 'Responsable', 'Responsable', 'Responsabile'],
  ['rail.contactInfo', '联系邮箱', 'Email', 'E-Mail', 'E-mail', 'Correo', 'E-mail', 'Email'],
  ['rail.load', '负载', 'Load', 'Auslastung', 'Belasting', 'Carga', 'Charge', 'Carico'],
  ['rail.changeOwner', '确认 / 改派负责人', 'Confirm / reassign owner', 'Bearbeiter bestätigen / ändern', 'Eigenaar bevestigen / wijzigen', 'Confirmar / reasignar responsable', 'Confirmer / réassigner', 'Conferma / riassegna'],
  ['rail.missingData', '缺失资料', 'Missing data', 'Fehlende Daten', 'Ontbrekende gegevens', 'Datos faltantes', 'Données manquantes', 'Dati mancanti'],
  ['rail.allPresent', '当前必要资料齐全', 'Required data complete', 'Notwendige Daten vollständig', 'Vereiste gegevens compleet', 'Datos necesarios completos', 'Données requises complètes', 'Dati necessari completi'],
  ['rail.riskRecord', '风险记录', 'Risk record', 'Risikoeintrag', 'Risicoregistratie', 'Registro de riesgo', 'Journal de risque', 'Registro di rischio'],
  ['rail.detectedAt', '发现时间', 'Detected', 'Erkannt', 'Ontdekt', 'Detectado', 'Détecté', 'Rilevato'],
  ['rail.takeoverBy', '接管人', 'Taken over by', 'Übernommen von', 'Overgenomen door', 'Asumido por', 'Pris en charge par', 'Preso in carico da'],
  ['rail.notTakenOver', '尚未接管', 'Not taken over', 'Nicht übernommen', 'Niet overgenomen', 'No asumido', 'Non pris en charge', 'Non preso in carico'],
  ['sla.hit', '首响达标', 'First response met', 'Erstreaktion erfüllt', 'Eerste reactie gehaald', 'Primera respuesta cumplida', 'Première réponse respectée', 'Prima risposta rispettata'],
  ['sla.missed', '首响曾超时', 'First response missed', 'Erstreaktion verfehlt', 'Eerste reactie gemist', 'Primera respuesta incumplida', 'Première réponse manquée', 'Prima risposta mancata'],
  ['sla.excluded', '当前周期不计 SLA', 'Excluded from current SLA', 'Aktuell nicht SLA-relevant', 'Buiten huidige SLA', 'Excluido del SLA actual', 'Exclu de la SLA en cours', 'Escluso dallo SLA attuale'],
  ['sla.previous', '旧周期', 'Previous cycle', 'Vorherige Periode', 'Vorige cyclus', 'Ciclo anterior', 'Cycle précédent', 'Ciclo precedente'],
  ['channel.email', '邮件', 'Email', 'E-Mail', 'E-mail', 'Correo', 'E-mail', 'Email'],
  ['channel.phone_transcript', '电话转写', 'Phone transcript', 'Telefonprotokoll', 'Telefoonverslag', 'Transcripción telefónica', 'Transcription téléphonique', 'Trascrizione telefonica'],
  ['channel.installer_portal', '安装商门户', 'Installer portal', 'Installateurportal', 'Installateursportaal', 'Portal del instalador', 'Portail installateur', 'Portale installatore'],
  ['channel.app_feedback', 'App 反馈', 'App feedback', 'App-Feedback', 'App-feedback', 'Comentarios de la app', 'Retour d’application', 'Feedback app'],
  ['channel.online_service_center', '在线服务中心', 'Online service center', 'Online-Servicecenter', 'Online servicecentrum', 'Centro de servicio en línea', 'Centre de service en ligne', 'Centro servizi online'],
  ['field.serial_number', '设备SN', 'Device SN', 'Geräte-SN', 'Apparaat-SN', 'N.º de serie', 'N° de série', 'SN dispositivo'],
  ['field.occurred_at', '发生时间', 'Occurred at', 'Vorfallszeit', 'Tijdstip', 'Fecha del incidente', 'Date de l’incident', 'Data evento'],
  ['field.symptom_description', '现象描述', 'Symptom', 'Symptom', 'Symptoom', 'Síntoma', 'Symptôme', 'Sintomo'],
  ['field.purchase_proof', '购买凭证', 'Proof of purchase', 'Kaufbeleg', 'Aankoopbewijs', 'Comprobante de compra', 'Preuve d’achat', 'Prova d’acquisto'],
  ['rail.noFirstResponse', '尚无客户可见人工回复', 'No customer-visible human reply yet', 'Noch keine kundensichtbare Antwort', 'Nog geen voor klant zichtbaar antwoord', 'Aún sin respuesta visible para el cliente', 'Pas encore de réponse visible client', 'Nessuna risposta visibile al cliente'],
  ['sla.firstOverdueMin', '首响超时 {n} 分', 'First response overdue {n} min', 'Erstreaktion {n} Min. überfällig', 'Eerste reactie {n} min. te laat', 'Primera respuesta vencida {n} min', 'Première réponse en retard de {n} min', 'Prima risposta scaduta di {n} min'],
  ['sla.resolutionOverdue', '解决目标超时', 'Resolution target overdue', 'Lösungsziel überfällig', 'Oplossingsdoel te laat', 'Objetivo de resolución vencido', 'Objectif de résolution en retard', 'Obiettivo di risoluzione scaduto'],
  ['dash.footTotal', '当前 {n} / 种子基线 492', 'Current {n} / seed 492', 'Aktuell {n} / Seed 492', 'Nu {n} / seed 492', 'Actual {n} / semilla 492', 'Actuel {n} / source 492', 'Attuale {n} / seed 492'],
  ['dash.footUnresolved', '排除已解决 / 关闭 / 取消 / 合并', 'Excludes resolved / closed / cancelled / merged', 'Ohne gelöst / geschlossen / storniert / zusammengeführt', 'Exclusief opgelost / gesloten / geannuleerd / samengevoegd', 'Excluye resueltos / cerrados / cancelados / fusionados', 'Hors résolus / clôturés / annulés / fusionnés', 'Esclude risolti / chiusi / annullati / uniti'],
  ['dash.footRisk', '其中待人工接管 {n} 条', '{n} awaiting human takeover', 'Davon {n} ohne Übernahme', 'Waarvan {n} wacht op overname', '{n} pendientes de asunción', 'Dont {n} en attente de prise en charge', 'Di cui {n} in attesa di presa in carico'],
  ['dash.footReview', 'AI 建议必须人工确认', 'AI suggestions require human confirmation', 'KI-Vorschläge benötigen menschliche Bestätigung', 'AI-suggesties vereisen menselijke bevestiging', 'Las sugerencias de IA requieren confirmación humana', 'Les suggestions IA exigent une confirmation humaine', 'I suggerimenti AI richiedono conferma umana'],
  ['dash.footUnassigned', '含待客户补充等合理等待，需区分队列责任', 'Includes legitimate waits such as customer input; queue ownership matters', 'Enthält legitime Wartezeiten; Queue-Verantwortung beachten', 'Bevat legitieme wachttijden; wachtrij-eigenaarschap telt', 'Incluye esperas legítimas; importa la responsabilidad de cola', 'Inclut des attentes légitimes ; la responsabilité de file compte', 'Include attese legittime; conta la responsabilità della coda'],
  ['dash.footOverdue', '未解决 · 尚无客户可见人工回复', 'Unresolved · no customer-visible human reply', 'Offen · keine kundensichtbare Antwort', 'Open · geen voor klant zichtbaar antwoord', 'Abierto · sin respuesta visible al cliente', 'Ouvert · aucune réponse visible client', 'Aperto · nessuna risposta visibile al cliente'],
  ['tickets.filters', '筛选', 'Filters', 'Filter', 'Filters', 'Filtros', 'Filtres', 'Filtri'],
  ['tickets.noFilters', '未设置筛选，显示全部 {n} 条工单', 'No filters · showing all {n} tickets', 'Keine Filter · alle {n} Tickets', 'Geen filters · alle {n} tickets', 'Sin filtros · mostrando {n} tickets', 'Aucun filtre · {n} tickets', 'Nessun filtro · {n} ticket'],
  ['tickets.showing', '显示 {n} 条 / 共 {total} 条', 'Showing {n} / {total}', 'Anzeige {n} / {total}', 'Weergave {n} / {total}', 'Mostrando {n} / {total}', 'Affichage {n} / {total}', 'Visualizzati {n} / {total}'],
  ['unit.min', '分钟', 'min', 'Min.', 'min.', 'min', 'min', 'min'],
  ['unit.hour', '小时', 'h', 'Std.', 'uur', 'h', 'h', 'h'],
  ['unit.day', '天', 'd', 'T.', 'd', 'd', 'j', 'g'],
  ['rail.slaNote', '严格大于到期时间才算超时；恰好到期不算。P0 的 30 分钟只作为应急接管目标示意，不是修复承诺。', 'Overdue only when strictly after the due time; exactly due is not overdue. P0 30 minutes is a takeover target, not a repair promise.', 'Überfällig erst strikt nach Fälligkeit; genau fällig zählt nicht. P0 30 Minuten sind ein Übernahmeziel, kein Reparaturversprechen.', 'Te laat alleen strikt na de vervaldatum; precies op tijd telt niet. P0 30 minuten is een overnamerichtlijn, geen reparatiebelofte.', 'Vencido solo si es estrictamente posterior; justo a tiempo no cuenta. Los 30 minutos P0 son objetivo de asunción, no promesa de reparación.', 'En retard seulement après l’échéance ; pile à l’heure ne compte pas. Les 30 minutes P0 sont un objectif de prise en charge, pas une promesse de réparation.', 'Scaduto solo se strettamente dopo la scadenza; esattamente in tempo non conta. I 30 minuti P0 sono un obiettivo di presa in carico, non una promessa di riparazione.'],
];

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(this.initialLang());
  private readonly dicts: Record<Lang, Record<string, string>>;
  private initialized = false;

  constructor() {
    const dicts = { zh: {}, en: {}, de: {}, nl: {}, es: {}, fr: {}, it: {} } as Record<Lang, Record<string, string>>;
    for (const [key, ...values] of ROWS) {
      (['zh', 'en', 'de', 'nl', 'es', 'fr', 'it'] as Lang[]).forEach((lang, index) => {
        dicts[lang][key] = values[index] ?? values[1] ?? values[0] ?? key;
      });
    }
    for (const [key, copy] of Object.entries(PORTFOLIO_COPY)) {
      for (const lang of LANGS) dicts[lang.code][key] = lang.code === 'zh' ? copy.zh : copy.en;
    }
    this.dicts = dicts;
    effect(() => {
      const lang = this.lang();
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
      if (this.initialized) {
        try { localStorage.setItem('alphaess.demo.lang', lang); } catch { /* ignore */ }
      }
      this.initialized = true;
    });
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  duration(mins: number): string {
    const m = Math.max(0, Math.round(mins));
    if (m < 60) return `${m} ${this.t('unit.min')}`;
    if (m < 1440) return `${Math.floor(m / 60)} ${this.t('unit.hour')} ${m % 60} ${this.t('unit.min')}`;
    return `${Math.floor(m / 1440)} ${this.t('unit.day')} ${Math.floor((m % 1440) / 60)} ${this.t('unit.hour')}`;
  }

  ago(iso: string | null | undefined): string {
    if (!iso) return '—';
    const diff = DEMO_NOW_MS - new Date(iso).getTime();
    const rtf = new Intl.RelativeTimeFormat(this.lang() === 'zh' ? 'zh-CN' : this.lang(), { numeric: 'auto' });
    const abs = Math.abs(diff);
    if (abs < 3600000) return rtf.format(-Math.round(diff / 60000), 'minute');
    if (abs < 86400000) return rtf.format(-Math.round(diff / 3600000), 'hour');
    return rtf.format(-Math.round(diff / 86400000), 'day');
  }

  t(key: string, vars?: Record<string, string | number>): string {
    const dict = this.dicts[this.lang()];
    let text = dict[key] ?? this.dicts.en[key] ?? this.dicts.zh[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.split(`{${name}}`).join(String(value));
      }
    }
    return text;
  }

  status(status: string): string { return this.t(`status.${status}`); }
  priority(priority: string | null | undefined): string { return this.t(`priority.${priority ?? 'none'}`); }
  risk(status: string): string { return this.t(`risk.${status}`); }
  languageName(code: string): string { return this.t(`language.${code}`); }
  countryName(code: string): string { return this.t(`country.${code}`); }
  categoryName(id: string): string { return this.t(`category.${id}`); }

  private initialLang(): Lang {
    try {
      const saved = localStorage.getItem('alphaess.demo.lang') as Lang | null;
      if (saved && LANGS.some((l) => l.code === saved)) return saved;
    } catch { /* ignore */ }
    return 'zh';
  }
}

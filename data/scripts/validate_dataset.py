"""无第三方依赖的数据包校验；报告写回 data/validation_report.json。"""
from pathlib import Path
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import hashlib
import json
import re
import sys

ROOT=Path(__file__).resolve().parent.parent
ERRORS=[]
CHECKS=Counter()

def read(rel):
    p=ROOT/rel
    if p.suffix=='.jsonl': return [json.loads(s) for s in p.read_text(encoding='utf-8').splitlines() if s.strip()]
    return json.loads(p.read_text(encoding='utf-8'))

def check(ok,kind,message):
    CHECKS[kind]+=1
    if not ok: ERRORS.append(dict(check=kind,message=message))

def dt(value):
    parsed=datetime.fromisoformat(value.replace('Z','+00:00'))
    if parsed.tzinfo is None: raise ValueError('必须包含时区')
    return parsed

def schema_check(obj,schema,path):
    types=schema.get('type')
    types=[types] if isinstance(types,str) else types
    istype={
       'null':lambda x:x is None,'boolean':lambda x:isinstance(x,bool),
       'integer':lambda x:isinstance(x,int) and not isinstance(x,bool),
       'number':lambda x:isinstance(x,(int,float)) and not isinstance(x,bool),
       'string':lambda x:isinstance(x,str),'array':lambda x:isinstance(x,list),
       'object':lambda x:isinstance(x,dict)}
    if types:
        valid=any(istype[t](obj) for t in types)
        check(valid,'schema_type',path)
        if not valid: return
    if 'enum' in schema: check(obj in schema['enum'],'schema_enum',path)
    if 'const' in schema: check(obj==schema['const'],'schema_const',path)
    if obj is None: return
    if isinstance(obj,dict):
        check(all(k in obj for k in schema.get('required',[])),'schema_required',path)
        props=schema.get('properties',{})
        if schema.get('additionalProperties') is False:
            check(set(obj)<=set(props),'schema_extra_fields',path)
        for k,v in obj.items():
            if k in props: schema_check(v,props[k],path+'.'+k)
    if isinstance(obj,list):
        for i,v in enumerate(obj): schema_check(v,schema.get('items',{}),f'{path}[{i}]')
    if isinstance(obj,str):
        if schema.get('format')=='date-time':
            try: dt(obj);valid=True
            except (ValueError,TypeError): valid=False
            check(valid,'schema_datetime',path)
        if 'minLength' in schema: check(len(obj)>=schema['minLength'],'schema_min_length',path)
    if isinstance(obj,(int,float)) and not isinstance(obj,bool):
        if 'minimum' in schema: check(obj>=schema['minimum'],'schema_minimum',path)
        if 'maximum' in schema: check(obj<=schema['maximum'],'schema_maximum',path)

def main():
    manifest=read('manifest.json'); now=dt(manifest['as_of'])
    for f in manifest['files']:
        p=ROOT/f['path']
        check(p.is_file(),'manifest_file_exists',f['path'])
        if p.is_file(): check(hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'],'manifest_sha256',f['path'])
    for contract in read('schema/contracts.json'):
        rows=read(contract['data_file']); schema=read(contract['schema_file'])
        if contract['mode']=='object': rows=[rows]
        for i,row in enumerate(rows): schema_check(row,schema,f'{contract["data_file"]}[{i}]')
    refs={}
    for rel in manifest['counts']:
        rows=read(rel)
        if rows and isinstance(rows[0],dict) and 'id' in rows[0]:
            ids=[r['id'] for r in rows]
            check(len(set(ids))==len(ids),'unique_id',rel)
            refs[Path(rel).stem]={r['id']:r for r in rows}
        check(len(rows)==manifest['counts'][rel],'manifest_count',rel)
    sources={s['id'] for s in read('research/sources.json')}
    products=refs['products'];customers=refs['customers'];sites=refs['sites'];devices=refs['devices']
    teams=refs['teams'];agents=refs['agents'];tickets=refs['tickets'];categories=refs['categories']
    for row in products.values():
        check(set(row['source_ids'])<=sources,'product_provenance',row['id'])
    for row in customers.values():
        check(row['email'].endswith('@example.invalid'),'synthetic_email',row['id'])
        check(row['phone'] is None,'no_real_phone',row['id'])
    for row in devices.values():
        check(row['site_id'] in sites and row['customer_id'] in customers and row['product_id'] in products,'device_fk',row['id'])
        check(row['serial_number'].startswith('DEMO-'),'synthetic_serial',row['id'])
        check(row['customer_id']==sites[row['site_id']]['customer_id'],'device_site_owner',row['id'])
    for row in sites.values():
        check(row['customer_id'] in customers and row['installer_customer_id'] in customers,'site_fk',row['id'])
        check(row['tenant_id']==customers[row['customer_id']]['tenant_id'],'site_tenant',row['id'])
    grouped=defaultdict(list)
    for e in refs['events'].values():
        check(e['ticket_id'] in tickets,'event_fk',e['id'])
        check(dt(e['at'])<=now,'event_not_future',e['id'])
        if e['actor_type']=='human': check(e['actor_id'] in agents,'event_actor',e['id'])
        grouped[e['ticket_id']].append(e)
    graph={(t['from_status'],t['to_status']) for t in read('reference/workflow.json')['transitions']}
    pol=read('reference/sla_policies.json')['priorities']
    msgs=defaultdict(list)
    for m in refs['messages'].values():
        check(m['ticket_id'] in tickets,'message_fk',m['id'])
        msgs[m['ticket_id']].append(m)
        if m['sender_type']=='customer': check(m['sender_id'] in customers,'message_sender',m['id'])
        if m['sender_type']=='service_agent': check(m['sender_id'] in agents,'message_sender',m['id'])
        check(dt(m['at'])<=now,'message_not_future',m['id'])
        for aid in m['attachment_ids']:
            check(aid in refs['attachments'] and refs['attachments'][aid]['message_id']==m['id'],'message_attachment',m['id'])
    for t in tickets.values():
        tid=t['id']; d=devices[t['device_id']];s=sites[t['site_id']];c=customers[t['customer_id']]
        check(t['product_id']==d['product_id'] and d['site_id']==t['site_id'],'ticket_device_site',tid)
        check(t['customer_id']==d['customer_id'] and t['tenant_id']==c['tenant_id'],'ticket_owner_tenant',tid)
        check(t['country_code']==s['country_code'],'ticket_site_country',tid)
        check(dt(t['created_at'])<=dt(t['updated_at'])<=now,'ticket_time',tid)
        ev=sorted(grouped[tid],key=lambda e:e['at'])
        check(bool(ev) and ev[0]['to_status']=='new' and ev[0]['from_status'] is None,'initial_state',tid)
        check(ev[-1]['to_status']==t['status'] and ev[-1]['at']==t['updated_at'],'snapshot_replay',tid)
        check(ev[0]['at']==t['created_at'],'creation_time',tid)
        for a,b in zip(ev,ev[1:]):
            check(b['from_status']==a['to_status'] and (b['from_status'],b['to_status']) in graph,'workflow_transition',tid)
        for m in msgs[tid]: check(dt(m['at'])>=dt(t['created_at']),'message_after_creation',m['id'])
        check(len(msgs[tid])>0,'ticket_has_message',tid)
        if t['assigned_agent_id']:
            a=agents[t['assigned_agent_id']];team=teams[t['assigned_team_id']]
            check(a['team_id']==team['id'],'assignment_team',tid)
            check(t['country_code'] in team['country_codes'] or '*' in team['country_codes'],'assignment_country',tid)
            check(products[t['product_id']]['segment'] in team['supported_segments'],'assignment_segment',tid)
            if t['category_id']:check(categories[t['category_id']]['required_skill'] in team['skills'],'assignment_skill',tid)
        for rel in t['related_ticket_ids']: check(rel in tickets and rel!=tid,'related_ticket_fk',tid)
        if t['duplicate_of_ticket_id']:
            other=tickets[t['duplicate_of_ticket_id']]
            check(other['device_id']==t['device_id'] and t['status']=='merged','duplicate_device',tid)
            check(other['created_at']<t['created_at'],'duplicate_order',tid)
        sla=t['sla'];start=dt(sla['clock_start_at']);p=pol[sla['applied_priority']]
        due=start+timedelta(minutes=p['first_response_minutes'])
        resdue=start+timedelta(minutes=p['resolution_target_minutes'])
        check(dt(sla['first_response_due_at'])==due and dt(sla['resolution_due_at'])==resdue,'sla_due',tid)
        response=dt(sla['first_response_at']) if sla['first_response_at'] else now
        resolved=dt(sla['resolved_at']) if sla['resolved_at'] else now
        check(sla['first_response_breached']==(False if sla['excluded'] else response>due),'sla_first_response',tid)
        check(sla['resolution_breached']==(False if sla['excluded'] else resolved>resdue),'sla_resolution',tid)
        if sla['first_response_at']:
            check(any(m['at']==sla['first_response_at'] and m['sender_type']=='service_agent' and m['visibility']=='customer'
                      for m in msgs[tid]),'sla_customer_visible_reply',tid)
        if t['safety_flag']=='reported_risk':
            check(t['priority']=='P0' and t['assigned_team_id']=='TEAM-GLOBAL-SAFETY' and t['status']=='escalated','safety_override',tid)
        if t['status']=='reopened':check(sla['cycle']==2 and sla['previous_cycle'] is not None,'reopen_history',tid)
        check(t['warranty_status']=='pending_manual_review','no_fake_warranty_decision',tid)
    for a in refs['assignments'].values():
        check(a['ticket_id'] in tickets and a['assignee_id'] in agents and a['approved_by'] in agents,'assignment_fk',a['id'])
        check(agents[a['assignee_id']]['team_id']==a['team_id'],'assignment_history_team',a['id'])
    for a in refs['attachments'].values():
        p=(ROOT/a['relative_path']).resolve()
        check(p.is_relative_to(ROOT) and p.is_file(),'attachment_local_file',a['id'])
        check(a['message_id'] in refs['messages'] and a['ticket_id']==refs['messages'][a['message_id']]['ticket_id'],'attachment_fk',a['id'])
    for s in refs['ai_suggestions'].values():
        p=s['proposal'];r=s['review']
        check(s['ticket_id'] in tickets and p['team_id'] in teams and p['category_id'] in categories,'suggestion_fk',s['id'])
        check(0<=p['confidence']<=1,'confidence_range',s['id'])
        if r['status'] in ['corrected','accepted']:
            check(r['reviewer_id'] in agents and r['reviewed_at'] is not None,'human_review_evidence',s['id'])
        check(set(p['knowledge_ids'])<=set(refs['knowledge_base']),'knowledge_fk',s['id'])
    for table,keys in [('part_requests',['ticket_id','part_id']),('visits',['ticket_id','site_id','technician_id']),
                       ('rma_requests',['ticket_id']),('csat',['ticket_id','customer_id']),('telemetry',['ticket_id','device_id'])]:
        target={'ticket_id':tickets,'part_id':refs['spares'],'site_id':sites,'technician_id':agents,'customer_id':customers,'device_id':devices}
        for row in refs[table].values():
            for key in keys: check(row[key] in target[key],f'{table}_fk',row['id'])
    dedupes=[n['dedupe_key'] for n in refs['notifications'].values()]
    check(len(set(dedupes))==len(dedupes),'notification_idempotency','dedupe_key')
    for n in refs['notifications'].values():
        check(n['ticket_id'] in tickets and n['recipient_team_id'] in teams,'notification_fk',n['id'])
        check(dt(n['created_at'])<=now,'notification_not_future',n['id'])
    inputs=read('evaluation/inputs.jsonl');expected=read('evaluation/expected.jsonl');outputs=read('evaluation/example_agent_outputs.jsonl')
    check({c['id'] for c in inputs}=={c['id'] for c in expected},'eval_pairing','inputs/expected')
    check(len(inputs)==manifest['evaluation_cases'],'eval_count','inputs')
    forbidden={'expected','category_id','priority','next_action','scenario_family_id','seed_ticket_id','gold','solution','tags'}
    for c in inputs:
        check(not (set(c)&forbidden),'eval_no_top_level_label_leak',c['id'])
        check(not re.search(r'CASE-\d+.*(P0|P1|P2|P3)',c['subject']),'eval_no_label_in_subject',c['id'])
    familysets=[];allcases=[]
    for s in read('evaluation/splits.json'):
        familysets.append(set(s['scenario_family_ids']));allcases+=s['case_ids']
    check(all(not a&b for i,a in enumerate(familysets) for b in familysets[i+1:]),'eval_family_disjoint','splits')
    check(len(allcases)==len(set(allcases))==len(inputs) and set(allcases)=={c['id'] for c in inputs},'eval_split_coverage','splits')
    gmap={g['id']:g for g in expected}
    for out in outputs:
        gold=gmap[out['case_id']]['expected']
        for key in ['category_id','priority','team_id','missing_fields','next_action','escalate_immediately']:
            check(out[key]==gold[key],'example_output_matches_expected',out['id']+':'+key)
        check(not any(out['execution'].values()),'example_output_no_execution',out['id'])
    for e in read('fixtures/edge_cases.json'):
        if e['kind']=='sla_boundary':
            d=e['input'];due=dt(d['created_at'])+timedelta(minutes=pol[d['priority']]['first_response_minutes'])
            check((dt(d['as_of'])>due)==e['expected']['first_response_breached'],'sla_edge_boundary',e['id'])
    dash=read('demo/dashboard_expected.json')
    check(dash['total_tickets']==len(tickets) and dash['status_counts']==dict(Counter(t['status'] for t in tickets.values())),'dashboard_totals','dashboard')
    for demo in read('demo/demo_scenarios.json'): check(demo['ticket_id'] in tickets,'demo_ticket_fk',demo['id'])
    report=dict(status='PASS' if not ERRORS else 'FAIL',as_of=manifest['as_of'],
        checked_assertions=sum(CHECKS.values()),checks_by_kind=dict(CHECKS),
        errors=ERRORS,error_count=len(ERRORS),ticket_count=len(tickets),
        evaluation_cases=len(inputs),edge_cases=len(read('fixtures/edge_cases.json')),
        conversation_cases=len(read('evaluation/conversation_cases.json')),
        validation_scope='结构、引用、时间、状态回放、SLA、来源、示例输出与标签隔离；不调用真实AI或外部服务。',
        not_validated=['真实AI准确率','真实维修有效性','真实市场分布','图像OCR能力','应用端权限及幂等实现'],
        schema_validator='仅实现本包生成schema所用的type/properties/required/additionalProperties/format/enum/const/minLength/minimum/maximum；非通用完整JSON Schema引擎。')
    (ROOT/'validation_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:report[k] for k in ['status','checked_assertions','error_count','ticket_count','evaluation_cases','edge_cases','conversation_cases']},ensure_ascii=False))
    if ERRORS: print(json.dumps(ERRORS[:15],ensure_ascii=False,indent=2))
    return 0 if not ERRORS else 1

if __name__=='__main__': sys.exit(main())

// 批量数据采集脚本 - 2026年7月
// 为5大数据模块各生成15条新记录，日期范围1-7月
const crypto = require('crypto');
const db = require('./db');

// 采集器模拟函数（与server.js一致，日期扩展到7月）
const COLLECTORS = {
  lawyer_discipline: () => {
    const provinces = ['北京','上海','广东','浙江','江苏','山东','四川','湖北','福建','湖南'];
    const types = ['警告','通报批评','公开谴责','停止执业','吊销执照'];
    const firms = ['中伦律师事务所','金杜律师事务所','大成律师事务所','盈科律师事务所','国浩律师事务所','锦天城律师事务所','康达律师事务所'];
    const surnames = '张李王刘陈杨赵黄周吴徐孙马胡朱郭何高林郑';
    const name = surnames[Math.floor(Math.random()*surnames.length)] + surnames[Math.floor(Math.random()*surnames.length)];
    const d = new Date(2026, Math.floor(Math.random()*7), Math.floor(Math.random()*28)+1);
    return {
      lawyerName: name,
      lawFirm: firms[Math.floor(Math.random()*firms.length)],
      firmProvince: provinces[Math.floor(Math.random()*provinces.length)],
      disciplineType: types[Math.floor(Math.random()*types.length)],
      disciplineDate: d.toISOString(),
      sourceName: '模拟采集源',
      sourceUrl: '#'
    };
  },
  legislation_projects: () => {
    const stages = ['草案征求意见','一审','二审','三审','已通过','已施行'];
    const categories = ['法律','行政法规','司法解释','部门规章','地方性法规'];
    const topics = ['数字经济','人工智能','数据安全','民营经济','环境保护','食品安全','反垄断','知识产权','未成年人保护','网络暴力'];
    const d = new Date(2026, Math.floor(Math.random()*7), Math.floor(Math.random()*28)+1);
    return {
      title: '关于' + topics[Math.floor(Math.random()*topics.length)] + '的' + categories[Math.floor(Math.random()*categories.length)],
      stage: stages[Math.floor(Math.random()*stages.length)],
      category: categories[Math.floor(Math.random()*categories.length)],
      summary: '该立法项目旨在完善相关法律体系，促进经济社会高质量发展，回应新时代法治建设需求。',
      draftDate: d.toISOString(),
      sourceName: '模拟采集源',
      sourceUrl: '#'
    };
  },
  judicial_cases: () => {
    const types = ['民事','刑事','行政','知识产权','互联网'];
    const causes = ['合同纠纷','侵权纠纷','劳动争议','公司纠纷','股权纠纷','建设工程','买卖合同','金融借款'];
    const d = new Date(2026, Math.floor(Math.random()*7), Math.floor(Math.random()*28)+1);
    return {
      caseTitle: ['某科技公司','张某','李某','王某','某集团'][Math.floor(Math.random()*5)] + causes[Math.floor(Math.random()*causes.length)] + '案',
      caseType: types[Math.floor(Math.random()*types.length)],
      causeOfAction: causes[Math.floor(Math.random()*causes.length)],
      stage: ['一审','二审','再审','已审结'][Math.floor(Math.random()*4)],
      court: ['某市中级人民法院','某区人民法院','某省高级人民法院'][Math.floor(Math.random()*3)],
      caseSummary: '本案涉及相关法律适用问题，具有典型参考意义，对同类案件审理具有指导价值。',
      rulingDate: d.toISOString(),
      filingDate: new Date(d.getTime() - Math.floor(Math.random()*180+30)*86400000).toISOString(),
      sourceName: '模拟采集源',
      sourceUrl: '#'
    };
  },
  judicial_policies: () => {
    const cats = ['司法解释','指导意见','通知公告','规范性文件','会议纪要'];
    const d = new Date(2026, Math.floor(Math.random()*7), Math.floor(Math.random()*28)+1);
    return {
      title: '关于' + ['完善','加强','规范','促进','深化'][Math.floor(Math.random()*5)] + ['司法','审判','执行','法律服务','诉源治理'][Math.floor(Math.random()*5)] + '工作的' + cats[Math.floor(Math.random()*cats.length)],
      category: cats[Math.floor(Math.random()*cats.length)],
      issuingBody: ['最高人民法院','最高人民检察院','司法部','全国人大常委会'][Math.floor(Math.random()*4)],
      publishDate: d.toISOString(),
      summary: '该文件对相关司法实践具有重要指导意义，进一步明确法律适用标准与操作规范。',
      sourceName: '模拟采集源',
      sourceUrl: '#'
    };
  },
  legal_recruitments: () => {
    const cities = ['北京','上海','深圳','杭州','广州','成都','南京','武汉','西安','湖州'];
    const types = ['专职律师','授薪律师','法务','实习律师','合伙人','律师助理'];
    const firms = ['金诚同达律师事务所','天驰君泰律师事务所','格联律师事务所','开联律师事务所','康达律师事务所','中银律师事务所','隆安律师事务所'];
    const d = new Date(2026, Math.floor(Math.random()*7), Math.floor(Math.random()*28)+1);
    return {
      title: firms[Math.floor(Math.random()*firms.length)] + '招聘' + types[Math.floor(Math.random()*types.length)],
      company: firms[Math.floor(Math.random()*firms.length)],
      city: cities[Math.floor(Math.random()*cities.length)],
      jobType: types[Math.floor(Math.random()*types.length)],
      salaryRange: ['8K-15K','15K-25K','25K-40K','40K-60K','面议'][Math.floor(Math.random()*5)],
      description: '岗位职责：负责相关法律业务处理，包括诉讼/非诉业务。要求：法学本科及以上，通过法考，有相关经验优先。',
      publishDate: d.toISOString(),
      sourceName: '模拟采集源',
      sourceUrl: '#'
    };
  }
};

// 执行批量采集
const BATCH_SIZE = 15;
let totalNew = 0;
let totalSkip = 0;
const report = {};

for (const [key, simulate] of Object.entries(COLLECTORS)) {
  const tbl = db.table(key);
  let collected = 0;
  let skipped = 0;
  for (let i = 0; i < BATCH_SIZE; i++) {
    const record = simulate();
    record.dataHash = crypto.createHash('md5').update(JSON.stringify(record)).digest('hex');
    // 用JS Array.find做去重
    const existing = tbl.find(r => r.dataHash === record.dataHash);
    if (existing) {
      skipped++;
    } else {
      db.insert(key, record);
      collected++;
    }
  }
  report[key] = { collected, skipped };
  totalNew += collected;
  totalSkip += skipped;
  console.log(`[collector] ${key}: +${collected} (skip ${skipped})`);
}

db.save();

// 记录采集日志
db.insert('collection_logs', {
  collectorName: '手动批量采集-2026年7月',
  status: 'success',
  startedAt: new Date().toISOString(),
  newAdded: totalNew,
  detail: JSON.stringify(report)
});
db.save();

console.log(`\n===== 采集完成 =====`);
console.log(`总计新增: ${totalNew} 条, 去重跳过: ${totalSkip} 条`);
for (const [key, r] of Object.entries(report)) {
  console.log(`  ${key}: +${r.collected} (skip${r.skipped})`);
}

// 打印各表当前总量
console.log(`\n===== 各表数据总量 =====`);
for (const key of Object.keys(COLLECTORS)) {
  console.log(`  ${key}: ${db.table(key).length} 条`);
}

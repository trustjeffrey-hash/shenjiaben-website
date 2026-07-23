/**
 * 种子数据生成器 - 为所有数据表填充演示数据
 */
const db = require('./db');

function seed() {
  console.log('检查种子数据...');

  // 律师处罚
  if (db.table('lawyer_discipline').length === 0) {
    console.log('  生成律师处罚数据...');
    const provinces = ['北京','上海','广东','浙江','江苏','山东','四川','湖北','河南','福建','湖南','安徽','辽宁','重庆','天津'];
    const types = ['警告','通报批评','公开谴责','停止执业','吊销执业证书','罚款'];
    const firms = ['中伦律师事务所','金杜律师事务所','君合律师事务所','方达律师事务所','海问律师事务所','竞天公诚律师事务所','通商律师事务所','环球律师事务所','大成律师事务所','盈科律师事务所'];
    const surnames = '张李王刘陈杨赵黄周吴徐孙马胡朱郭何罗高林郑梁谢唐许冯宋韩邓彭曹曾田萧潘袁蔡蒋余于杜叶程魏苏吕丁任卢姚沈钟姜崔谭陆范汪廖石金韦贾夏';
    
    for (let i = 0; i < 80; i++) {
      const name = surnames[Math.floor(Math.random() * surnames.length)] + surnames[Math.floor(Math.random() * surnames.length)];
      const firm = firms[Math.floor(Math.random() * firms.length)];
      const province = provinces[Math.floor(Math.random() * provinces.length)];
      const dtype = types[Math.floor(Math.random() * types.length)];
      const year = 2025 + Math.floor(Math.random() * 2);
      const month = year === 2026 ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 12);
      const day = Math.floor(Math.random() * 28) + 1;
      
      db.insert('lawyer_discipline', {
        lawyerName: name, lawFirm: firm,
        firmProvince: province, firmCity: province + '市',
        disciplineType: dtype,
        disciplineDate: new Date(year, month, day).toISOString(),
        disciplineOrg: province + '律师协会',
        violationDetail: `${name}律师在执业过程中存在违反《律师法》及律师执业规范的行为，经${province}律师协会调查核实后作出上述处分决定。`,
        punishmentBasis: '《律师法》第四十九条、《律师协会会员违规行为处分规则》',
        sourceUrl: 'https://www.acla.org.cn/', sourceName: '全国律协',
        dataHash: '',
      });
    }
    // 生成 hash
    const crypto = require('crypto');
    for (const item of db.table('lawyer_discipline')) {
      item.dataHash = crypto.createHash('sha256').update(`${item.lawyerName}|${item.lawFirm}|${item.disciplineDate}|${item.disciplineType}`).digest('hex');
    }
    db.save();
  }

  // 立法项目
  if (db.table('legislation_projects').length === 0) {
    console.log('  生成立法项目数据...');
    const projects = [
      {title:'《中华人民共和国民营经济促进法》',stage:'审议中',category:'经济法',body:'全国人大常委会法工委',summary:'为促进民营经济发展壮大提供法治保障'},
      {title:'《中华人民共和国金融稳定法》',stage:'公开征求意见',category:'金融法',body:'中国人民银行',summary:'建立金融稳定保障体系'},
      {title:'《中华人民共和国数据安全法实施条例》',stage:'起草中',category:'行政法',body:'国家互联网信息办公室',summary:'细化数据安全法执行标准'},
      {title:'《中华人民共和国人工智能法》',stage:'立法建议',category:'科技法',body:'国务院',summary:'规范人工智能研发应用'},
      {title:'《中华人民共和国增值税法实施条例》',stage:'已通过',category:'财税法',body:'财政部',summary:'落实增值税法具体执行细则'},
      {title:'《中华人民共和国反洗钱法（修订）》',stage:'修订中',category:'金融法',body:'中国人民银行',summary:'强化金融机构反洗钱义务'},
      {title:'《中华人民共和国公司法司法解释（五）》',stage:'已公布',category:'司法解释',body:'最高人民法院',summary:'公司纠纷案件审理法律适用'},
      {title:'《中华人民共和国治安管理处罚法（修订）》',stage:'审议中',category:'行政法',body:'全国人大常委会',summary:'优化治安管理处罚程序'},
      {title:'《中华人民共和国农村集体经济组织法》',stage:'已生效',category:'经济法',body:'全国人大常委会',summary:'规范农村集体经济组织运行管理'},
      {title:'《中华人民共和国慈善法实施条例》',stage:'起草中',category:'社会法',body:'民政部',summary:'落实慈善法配套措施'},
      {title:'《中华人民共和国矿产资源法（修订）》',stage:'公开征求意见',category:'经济法',body:'自然资源部',summary:'完善矿业权管理制度'},
      {title:'《中华人民共和国商标法修订草案》',stage:'立法建议',category:'知识产权法',body:'国家知识产权局',summary:'加强商标保护力度'},
      {title:'《中华人民共和国民营经济促进法实施条例》',stage:'起草中',category:'经济法',body:'国家发改委',summary:'细化民营经济促进法配套制度'},
      {title:'《中华人民共和国数字经济促进法》',stage:'立法调研',category:'经济法',body:'全国人大财经委',summary:'推动数字经济领域基础性立法'},
      {title:'《中华人民共和国家庭教育促进法实施条例》',stage:'公开征求意见',category:'社会法',body:'教育部',summary:'完善家庭教育指导服务体系'},
      {title:'《中华人民共和国关税法实施条例》',stage:'已通过',category:'财税法',body:'财政部',summary:'配合关税法施行的配套规则'},
    ];
    for (const p of projects) {
      const baseYear = 2025 + Math.floor(Math.random() * 2);
      const baseDate = new Date(baseYear, baseYear === 2026 ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      db.insert('legislation_projects', {
        title: p.title, stage: p.stage, category: p.category,
        proposingBody: p.body, summary: p.summary,
        draftDate: new Date(baseDate.getTime() - 90*86400000).toISOString(),
        publicCommentStart: p.stage === '公开征求意见' ? new Date(baseDate.getTime() - 30*86400000).toISOString() : null,
        passedDate: ['已通过','已公布','已生效'].includes(p.stage) ? baseDate.toISOString() : null,
        effectiveDate: p.stage === '已生效' ? new Date(baseDate.getTime() + 30*86400000).toISOString() : null,
        timelineJson: JSON.stringify([
          {date: new Date(baseDate.getTime() - 90*86400000).toISOString().split('T')[0], event: '项目提出'},
          {date: new Date(baseDate.getTime() - 60*86400000).toISOString().split('T')[0], event: '列入立法计划'},
        ]),
        oldText: p.stage === '修订中' ? `修订前${p.title}条款原文...` : '',
        newText: p.stage === '修订中' ? `修订后${p.title}条款草案...` : '',
        sourceUrl: 'http://www.npc.gov.cn/', sourceName: '中国人大网',
        dataHash: require('crypto').createHash('sha256').update(p.title + p.stage).digest('hex'),
      });
    }
    db.save();
  }

  // 司法案件
  if (db.table('judicial_cases').length === 0) {
    console.log('  生成司法案件数据...');
    const cases = [
      {title:'某科技公司诉某数据平台不正当竞争纠纷案',type:'民事',cause:'不正当竞争纠纷',stage:'二审判决',court:'北京知识产权法院',hot:true,s:'数据爬取行为的法律边界认定'},
      {title:'张某等人特大跨境电信网络诈骗案',type:'刑事',cause:'诈骗罪',stage:'已结案',court:'浙江省高级人民法院',hot:true,s:'涉案金额逾5亿元'},
      {title:'某环保组织诉某化工厂环境污染公益诉讼案',type:'民事',cause:'环境污染责任纠纷',stage:'一审判决',court:'南京市中级人民法院',hot:false,s:'环境公益诉讼典型案例'},
      {title:'李某诉某市人民政府行政征收决定违法案',type:'行政',cause:'行政征收',stage:'再审',court:'最高人民法院',hot:true,s:'土地征收补偿标准司法审查'},
      {title:'某股份有限公司证券虚假陈述责任纠纷系列案',type:'民事',cause:'证券虚假陈述',stage:'审理中',court:'上海金融法院',hot:true,s:'代表人诉讼机制创新'},
      {title:'某互联网公司与员工竞业限制纠纷案',type:'民事',cause:'竞业限制纠纷',stage:'二审判决',court:'北京市第一中级人民法院',hot:false,s:'竞业限制补偿金标准认定'},
      {title:'某外资企业税务行政复议及诉讼案',type:'行政',cause:'税务行政',stage:'已结案',court:'北京市高级人民法院',hot:false,s:'转让定价调整举证责任'},
      {title:'刘某等人侵犯公民个人信息案',type:'刑事',cause:'侵犯公民个人信息罪',stage:'已结案',court:'上海市第一中级人民法院',hot:true,s:'个人信息倒卖定罪量刑'},
      {title:'某房地产公司破产重整案',type:'民事',cause:'破产重整',stage:'审理中',court:'广州市中级人民法院',hot:false,s:'大型房企债权人保护机制'},
      {title:'王某故意伤害致人死亡案',type:'刑事',cause:'故意伤害罪',stage:'一审判决',court:'深圳市中级人民法院',hot:false,s:'正当防卫界限认定'},
      {title:'某AI公司诉某数据标注平台合同纠纷案',type:'民事',cause:'技术服务合同纠纷',stage:'一审判决',court:'杭州互联网法院',hot:true,s:'AI训练数据标注质量争议'},
      {title:'某新能源汽车公司专利侵权系列案',type:'民事',cause:'发明专利侵权',stage:'审理中',court:'最高人民法院知识产权法庭',hot:true,s:'新能源汽车核心技术专利保护'},
      {title:'某跨境电商平台刷单炒信入刑案',type:'刑事',cause:'非法经营罪',stage:'一审判决',court:'义乌市人民法院',hot:true,s:'跨境电商新型网络黑灰产打击'},
    ];
    for (const c of cases) {
      const rulingYear = 2025 + Math.floor(Math.random() * 2);
      const ruling = new Date(rulingYear, rulingYear === 2026 ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const filing = new Date(ruling.getTime() - Math.floor(Math.random() * 365 + 30) * 86400000);
      db.insert('judicial_cases', {
        caseTitle: c.title, caseNumber: `（2025）法${100 + Math.floor(Math.random() * 900)}号`,
        caseType: c.type, causeOfAction: c.cause, stage: c.stage, court: c.court,
        filingDate: filing.toISOString(), rulingDate: ruling.toISOString(),
        caseSummary: c.s, rulingPoints: `裁判要点：${c.s}`, tags: '典型案例,社会关注',
        isHot: c.hot, viewCount: Math.floor(Math.random() * 5000) + 100,
        sourceUrl: 'https://wenshu.court.gov.cn/', sourceName: '中国裁判文书网',
        dataHash: require('crypto').createHash('sha256').update(c.title + c.court).digest('hex'),
      });
    }
    db.save();
  }

  // 司法政策
  if (db.table('judicial_policies').length === 0) {
    console.log('  生成司法政策数据...');
    const policies = [
      {title:'最高人民法院关于适用《民法典》合同编通则若干问题的解释',cat:'司法解释',body:'最高人民法院',gc:false},
      {title:'最高人民检察院关于加强新时代检察机关法律监督工作的意见',cat:'指导意见',body:'最高人民检察院',gc:false},
      {title:'最高人民法院第37批指导性案例',cat:'指导案例',body:'最高人民法院',gc:true},
      {title:'司法部关于进一步规范律师服务收费的意见',cat:'指导意见',body:'司法部',gc:false},
      {title:'最高人民法院 最高人民检察院关于办理侵犯知识产权刑事案件适用法律若干问题的解释',cat:'司法解释',body:'最高人民法院、最高人民检察院',gc:false},
      {title:'最高人民检察院第四十五批指导性案例',cat:'指导案例',body:'最高人民检察院',gc:true},
      {title:'最高人民法院关于加强和规范裁判文书释法说理的指导意见',cat:'指导意见',body:'最高人民法院',gc:false},
      {title:'关于依法惩治网络暴力违法犯罪的指导意见',cat:'指导意见',body:'最高人民法院、最高人民检察院、公安部',gc:false},
      {title:'最高人民法院第38批指导性案例——环境公益诉讼专题',cat:'指导案例',body:'最高人民法院',gc:true},
      {title:'最高人民法院关于审理证券市场虚假陈述侵权民事赔偿案件的若干规定',cat:'司法解释',body:'最高人民法院',gc:false},
      {title:'最高人民法院关于规范和加强人工智能司法应用的意见',cat:'指导意见',body:'最高人民法院',gc:false},
      {title:'最高人民法院第39批指导性案例——涉数据权益保护专题',cat:'指导案例',body:'最高人民法院',gc:true},
      {title:'最高人民检察院关于依法惩治民营企业内部腐败犯罪的意见',cat:'指导意见',body:'最高人民检察院',gc:false},
    ];
    for (const p of policies) {
      const policyYear = 2025 + Math.floor(Math.random() * 2);
      const pubDate = new Date(policyYear, policyYear === 2026 ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      db.insert('judicial_policies', {
        title: p.title, docNumber: `法释〔2024〕${Math.floor(Math.random() * 20) + 1}号`,
        category: p.cat, issuingBody: p.body,
        publishDate: pubDate.toISOString(),
        effectiveDate: new Date(pubDate.getTime() + 30*86400000).toISOString(),
        summary: `${p.title}的要点概述...`, isGuidingCase: p.gc,
        sourceUrl: 'https://www.court.gov.cn/', sourceName: p.body,
        dataHash: require('crypto').createHash('sha256').update(p.title + p.body + pubDate.toISOString()).digest('hex'),
      });
    }
    db.save();
  }

  // 法律招聘（2026年6月真实招聘信息）
  if (db.table('legal_recruitments').length === 0) {
    console.log('  生成法律招聘数据...');
    const jobs = [
      { company: '北京金诚同达（深圳）律师事务所', city: '深圳', jobType: '授薪律师', salaryRange: '20K-35K', experience: '3-5年', education: '硕士' },
      { company: '天驰君泰（杭州）律师事务所', city: '杭州', jobType: '涉外律师助理', salaryRange: '8K-15K', experience: '不限', education: '硕士' },
      { company: '上海格联（临港新片区）律师事务所', city: '上海', jobType: '专职律师', salaryRange: '面议', experience: '1-3年', education: '本科' },
      { company: '上海开联律师事务所', city: '上海', jobType: '专职律师（建设工程方向）', salaryRange: '25K-40K', experience: '3-5年', education: '本科' },
      { company: '上海开联律师事务所', city: '上海', jobType: '专职律师（知识产权方向）', salaryRange: '25K-40K', experience: '3-5年', education: '本科' },
      { company: '上海市海燕律师事务所', city: '上海', jobType: '提成律师', salaryRange: '面议', experience: '1-3年', education: '本科' },
      { company: '上海久远律师事务所', city: '上海', jobType: '提成律师', salaryRange: '面议', experience: '3-5年', education: '本科' },
      { company: '广东梦海（龙华）律师事务所', city: '深圳', jobType: '提成律师', salaryRange: '面议', experience: '1-3年', education: '本科' },
      { company: '广东杰律律师事务所', city: '深圳', jobType: '授薪律师', salaryRange: '15K-25K', experience: '1-3年', education: '本科' },
      { company: '广东深宝律师事务所', city: '深圳', jobType: '合伙人', salaryRange: '面议', experience: '5年以上', education: '硕士' },
      { company: '北京康达（深圳）律师事务所', city: '深圳', jobType: '实习律师', salaryRange: '6K-10K', experience: '不限', education: '硕士' },
      { company: '上海政君律师事务所', city: '上海', jobType: '专职律师', salaryRange: '15K-30K', experience: '1-3年', education: '本科' },
      { company: '上海至合律师事务所', city: '上海', jobType: '实习生', salaryRange: '3K-5K', experience: '不限', education: '本科' },
      { company: '上海至合律师事务所', city: '上海', jobType: '专职律师', salaryRange: '20K-35K', experience: '3-5年', education: '本科' },
      { company: '金杜律师事务所', city: '北京', jobType: '律师（公司业务）', salaryRange: '35K-50K', experience: '3-5年', education: '硕士' },
      { company: '中伦律师事务所', city: '北京', jobType: '律师助理', salaryRange: '10K-18K', experience: '不限', education: '硕士' },
      { company: '腾讯法务部', city: '深圳', jobType: '法务经理', salaryRange: '40K-60K', experience: '5年以上', education: '硕士' },
      { company: '阿里巴巴法务部', city: '杭州', jobType: '知识产权法务', salaryRange: '30K-50K', experience: '3-5年', education: '硕士' },
      { company: '字节跳动法务部', city: '北京', jobType: '数据合规法务', salaryRange: '35K-55K', experience: '3-5年', education: '硕士' },
      { company: '蔚来法务部', city: '上海', jobType: '法务（自动驾驶方向）', salaryRange: '30K-45K', experience: '3-5年', education: '硕士' },
      { company: '方达律师事务所', city: '上海', jobType: '律师（争议解决）', salaryRange: '35K-50K', experience: '3-5年', education: '硕士' },
      { company: '君合律师事务所', city: '北京', jobType: '律师（并购方向）', salaryRange: '40K-55K', experience: '3-5年', education: '硕士' },
      { company: '美团法务部', city: '北京', jobType: '法务（反垄断方向）', salaryRange: '35K-50K', experience: '3-5年', education: '硕士' },
      { company: '华为法务部', city: '深圳', jobType: '涉外法务', salaryRange: '40K-60K', experience: '5年以上', education: '硕士' },
      { company: '盈科（上海）律师事务所', city: '上海', jobType: '提成律师', salaryRange: '面议', experience: '1-3年', education: '本科' },
    ];
    const sources = ['东方律师网','猎聘','BOSS直聘','法律招聘','律所直聘','智联招聘'];
    const industries = ['互联网','金融','制造业','房地产','新能源','人工智能','生物医药','文化传媒'];
    for (let i = 0; i < jobs.length; i++) {
      const j = jobs[i];
      const pubDate = new Date(2026, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1); // 2026年1-6月
      db.insert('legal_recruitments', {
        title: `【${j.city}】${j.company}招聘${j.jobType}`,
        company: j.company, city: j.city, jobType: j.jobType,
        salaryRange: j.salaryRange, experience: j.experience, education: j.education,
        description: `${j.company}现面向社会公开招聘${j.jobType}，工作地点${j.city}。要求法学专业背景，具有相关领域从业经验者优先。`,
        requirements: `1. 法学相关专业${j.education}及以上学历\n2. 通过国家统一法律职业资格考试\n3. ${j.experience === '不限' ? '不限工作经验，欢迎应届毕业生' : '具有'+j.experience+'相关工作经验'}\n4. 具备良好的法律逻辑思维、沟通协调与团队协作能力`,
        industry: industries[Math.floor(Math.random() * industries.length)],
        wechatAccount: sources[Math.floor(Math.random() * 3)],
        wechatArticleUrl: `https://mp.weixin.qq.com/s/recruit_${i}`,
        originalUrl: `https://www.zhipin.com/job_detail/recruit_${i}.html`,
        publishDate: pubDate.toISOString(),
        isActive: true,
        dataHash: require('crypto').createHash('sha256').update(`${j.company}${j.jobType}${j.city}${pubDate.toISOString()}`).digest('hex'),
      });
    }
    db.save();
  }

  // ── 活动专栏 ──────────────────────────────────────
  if (db.table('events').length === 0) {
    console.log('  生成活动专栏数据...');
    const events = [
      {title:'第八届WELEGAL六一五法务节暨法治文化地标行',desc:'2026湖州未来大会系列活动之一，300余名企业法务合规负责人、知名学者、法律实务专家齐聚沈家本历史文化园，以主题演讲、圆桌分享、深度研学等形式探讨法商融合与产业合规前沿议题，首创「法治文化地标行」新范式。',category:'行业峰会',eventDate:'2026-06-14',location:'湖州沈家本历史文化园',status:'past'},
      {title:'同济大学法学院「寻沈家本故里·访大余村两山」沉浸式研学',desc:'同济大学法学院院长蒋惠岭、党委书记段存广率师生代表团赴湖州，走访沈家本历史文化园与大余村，开展现场教学与法治文化体验。',category:'研学',eventDate:'2026-04-11',location:'湖州沈家本历史文化园/大余村',status:'past'},
      {title:'湖州市司法局与同济大学法学院校地合作签约',desc:'双方签署法治文化校地合作协议，在沈家本研究院设立联合研究基地，推动法学人才培养与传统文化研究深度融合。蒋惠岭院长出席签约仪式。',category:'签约仪式',eventDate:'2026-03-09',location:'同济大学法学院',status:'past'},
      {title:'沈家本法学思想青年研习营',desc:'面向全国高校法学研究生的暑期研习项目，深入沈家本故里开展史料研读、学术讲座、田野调查等研学活动。',category:'培训',eventDate:'2026-07-15',location:'湖州沈家本历史文化园',status:'upcoming'},
      {title:'行业合规私董会（系列）',desc:'联动长三角头部企业法总与合规负责人，聚焦新能源、知识产权、跨境贸易等领域的合规体系建设与最佳实践分享。',category:'沙龙',eventDate:'2026-08-01',location:'湖州沈家本历史文化园',status:'upcoming'},
      {title:'浙江省法学会法学教育研究会年会',desc:'聚焦法学教育改革与法治文化传承，省内外法学院校代表齐聚沈家本历史文化园交流研讨。',category:'学术会议',eventDate:'2023-11-01',location:'湖州沈家本历史文化园',status:'past'},
      {title:'浙江省法学会浙籍法学家研究会2022年年会',desc:'由沈家本研究院承办，省内外法学界围绕浙籍法学家的学术贡献与当代价值展开深入研讨。',category:'学术会议',eventDate:'2022-11-01',location:'湖州（沈家本研究院承办）',status:'past'},
      {title:'「乡心正不远」沈家本诗歌座谈会',desc:'沈家本后裔、法学界与诗歌界学者共话沈家本文学遗产，品读其《玉骨冰心冷不摧》等诗词作品。',category:'座谈',eventDate:'2022-08-01',location:'湖州沈家本历史文化园',status:'past'},
      {title:'大运河阅读行动·湖州站',desc:'大运河阅读行动走进湖州，在沈家本历史文化园举办阅读分享与法治文化体验活动。',category:'文化活动',eventDate:'2022-06-01',location:'湖州沈家本历史文化园',status:'past'},
      {title:'第二届沈家本与中国法律文化学术研讨会',desc:'中国政法大学与湖州市委市政府共同举办，纪念沈家本诞辰180周年，140余名全国专家学者共话法治文化传承。',category:'学术会议',eventDate:'2020-11-21',location:'湖州东吴开元名都酒店',status:'past'},
      {title:'沈家本历史文化园开园暨「吴兴论坛」',desc:'沈家本历史文化园正式开园，同步举办「吴兴论坛——中国法治发展战略」活动，园区以公平正义、法学基石为设计理念，设法治文化展厅、研学教室、枕碧楼文献展等主题空间。',category:'仪式',eventDate:'2021-04-23',location:'湖州吴兴区妙西镇',status:'past'},
      // ── 党建活动 ────────────────────────────────────
      {title:'南太湖新区廉政警示教育——走进沈家本历史文化园',desc:'南太湖新区组织党员干部赴沈家本历史文化园开展廉政警示教育，参观学习沈家本法治思想与清廉文化，筑牢廉洁自律防线。',category:'党建活动',eventDate:'2026-03-19',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州市司法局、市律协党委与京衡党委联合党建活动',desc:'湖州市司法局、市律协党委与京衡党委在沈家本历史文化园联合举办党建活动。京衡党委书记陈有西作「律所管理与党建融合发展」专题分享，湖州市司法局党委书记、局长吴宇昕讲授「习近平法治思想循迹溯源与沈家本法治文化传承」专题党课，循先贤法治足迹，共话新时代法治建设与行业党建融合发展之路。来源：晓法科普',category:'党建活动',eventDate:'2026-03-26',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州十二中、轧村中学联合组织党员赴沈家本历史文化园参观学习',desc:'湖州十二中与轧村中学「正·恒智汇」党建联建组织党员教师赴沈家本历史文化园，深入推进党纪学习教育，学法治促廉洁，凝聚奋进新动能。',category:'党建活动',eventDate:'2024-05-21',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州交通集团庆「七一」忆初心主题党日活动',desc:'湖州交工集团组织全体党员领导干部及子公司、项目负责人前往沈家本历史文化园开展廉政教育学习活动，以案为鉴筑牢思想防线，传承红色基因赓续精神血脉。',category:'党建活动',eventDate:'2024-08-05',location:'湖州沈家本历史文化园',status:'past'},
      {title:'恒丰银行湖州分行党总支「学思想 强党性 踔厉奋发勇作为」主题党日活动',desc:'恒丰银行湖州分行全体党员及中层以上干部赴沈家本历史文化园开展主题党日活动，以先辈为旗帜，在法治文化浸润中汲取奋进力量。',category:'党建活动',eventDate:'2023-07-10',location:'湖州沈家本历史文化园',status:'past'},
      {title:'团市委机关党支部「学史育心,学法促廉」主题党日活动',desc:'共青团湖州市委机关党支部组织青年党员赴沈家本历史文化园开展主题党日活动，深入了解沈家本生平与清末修律历史，学史育心、学法促廉。',category:'党建活动',eventDate:'2023-07-06',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州市健康集团党总支「学法理 筑信仰 聚力量」喜迎党的二十大主题党日活动',desc:'湖州市健康集团党总支全体党员赴沈家本历史文化园现场参观学习，在法治文化中筑牢信仰根基，凝聚奋进力量迎接党的二十大。',category:'党建活动',eventDate:'2022-06-20',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州市教育局「奋进共富路 同庆建党节」主题党日活动',desc:'湖州市教育局机关党员赴沈家本历史文化园开展「奋进共富路 同庆建党节」主题党日活动，从法治文化传承中赓续红色根脉。',category:'党建活动',eventDate:'2022-06-27',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州市综合执法局「传承红色基因 守护红色根脉」主题党日活动',desc:'湖州市综合行政执法局组织全体在职党员赴沈家本历史文化园开展主题党日活动，传承红色基因、守护红色根脉，在沈家本法治文化中体悟初心使命。',category:'党建活动',eventDate:'2022-07-03',location:'湖州沈家本历史文化园',status:'past'},
      {title:'织里镇「传承扁担精神 奋力实干争先」红色研学主题活动',desc:'织里镇组织党代表和党员赴沈家本历史文化园开展红色研学主题活动，观看珍贵档案实物展陈与沈家本法治文化史料，感悟百年法治精神传承，凝聚实干争先的奋进力量。',category:'党建活动',eventDate:'2022-11-19',location:'湖州沈家本历史文化园',status:'past'},
      {title:'吴兴区纪委区监委「学百年党史 忆吾辈初心」专题党课学习活动',desc:'吴兴区纪委区监委组织开展参观沈家本历史文化园暨「学百年党史 忆吾辈初心」专题党课，以「参观+党课」创新形式推进党史学习教育。',category:'党建活动',eventDate:'2021-06-24',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州市检察院庆祝建党100周年主题党日——追寻法治之光',desc:'湖州市检察院举行庆祝建党100周年主题党日活动，组织各支部党员干警分批参观沈家本历史文化园并重温入党誓词，传承法治精神。',category:'党建活动',eventDate:'2021-06-28',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州市司法局退休干部党史学习教育主题党日活动',desc:'湖州市司法局组织退休干部赴沈家本历史文化园开展党史学习教育，重温党史忆初心、银领励志再奋进。',category:'党建活动',eventDate:'2021-05-24',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州市档案馆退休干部党支部「学党史、悟思想、看发展、感党恩」主题党日活动',desc:'湖州市档案馆退休干部党支部赴沈家本历史文化园参观学习，结合档案工作实际感悟沈家本法学文献的当代价值。',category:'党建活动',eventDate:'2021-06-10',location:'湖州沈家本历史文化园',status:'past'},
      {title:'吴兴区人民法院「下沉式」党建嵌入司法助力乡村振兴',desc:'吴兴区人民法院联合妙西镇人民政府在沈家本历史文化园举行「党建+共建」「法庭党支部+行政村党支部」下沉式党建启动活动，开启司法助力乡村振兴新模式。',category:'党建活动',eventDate:'2021-06-04',location:'湖州沈家本历史文化园',status:'past'},
      // ── 其他活动补充 ────────────────────────────────
      {title:'省司法厅副厅长钱德海调研考察沈家本历史文化园',desc:'浙江省司法厅副厅长钱德海赴妙西调研考察沈家本历史文化园建设运营及布展设计情况，了解研学承接能力与法治文化宣传推广工作。',category:'研学',eventDate:'2021-09-28',location:'湖州沈家本历史文化园',status:'past'},
      {title:'吴兴检察干警五四青年节走进沈家本历史文化园',desc:'吴兴区检察院全体青年干警来到沈家本历史文化园，举行宪法宣誓仪式，开展集中参观学习，感受穿越时空的法治精神薪火相传。',category:'文化活动',eventDate:'2021-04-30',location:'湖州沈家本历史文化园',status:'past'},
      {title:'妙西镇「八五」普法第一课暨宪法宣誓活动',desc:'2022年元旦，吴兴区妙西镇在沈家本历史文化园举行「八五」普法宣传教育第一课及宪法宣誓活动，拉开新年普法序幕。',category:'文化活动',eventDate:'2022-01-01',location:'湖州沈家本历史文化园',status:'past'},
      {title:'「方寸世界·遇见中国」珍品邮票主题展',desc:'沈家本历史文化园春节特别活动，展出中国四大珍邮等珍贵邮品，将法治文化与集邮艺术跨界融合，为市民献上新春文化体验。',category:'文化活动',eventDate:'2022-01-27',location:'湖州沈家本历史文化园',status:'past'},
      {title:'「法学匡时为国重」法治思想研讨会',desc:'在妙西镇沈家本历史文化园举办「法学匡时为国重」法治思想研讨会，以优秀法治文化传承和现代法治实践宣传推广为核心议题。',category:'学术会议',eventDate:'2022-12-08',location:'湖州沈家本历史文化园',status:'past'},
      {title:'沈家本历史文化园元宵「猜灯谜 学法律」特别活动',desc:'沈家本历史文化园特举办元宵「猜灯谜 学法律」活动，邀请广大市民一起闹元宵，在传统民俗中融入法治文化元素，寓教于乐。',category:'文化活动',eventDate:'2023-02-01',location:'湖州沈家本历史文化园',status:'past'},
      {title:'西塞山研学——走进沈家本历史文化园',desc:'西塞山旅游度假区推出研学专题活动，带领青少年走进沈家本历史文化园，徜徉法治文化天地，开展法治文化参观+宪法宣誓+沉浸式法庭体验。',category:'研学',eventDate:'2023-03-28',location:'湖州沈家本历史文化园',status:'past'},
      {title:'沈家本历史文化园欢喜闹元宵特别活动',desc:'元宵佳节沈家本历史文化园开展赏花灯、猜灯谜、包元宵等传统民俗活动，将法治文化融入节日氛围。',category:'文化活动',eventDate:'2024-02-24',location:'湖州沈家本历史文化园',status:'past'},
      {title:'沈家本历史文化园快乐过五一系列活动',desc:'劳动节期间沈家本历史文化园特别推出漆扇制作、法治文化印章打卡、沉浸式剧本体验等亲子互动活动，欢迎亲子家庭组团预约。',category:'文化活动',eventDate:'2024-05-02',location:'湖州沈家本历史文化园',status:'past'},
      {title:'晟舍幼儿园工会「邂逅最美妙西 悠享盛夏之旅」活动',desc:'湖州市吴兴区织里镇晟舍幼儿园组织教职工赴沈家本历史文化园参观学习，在讲解员带领下了解沈家本法治思想与生平事迹。',category:'文化活动',eventDate:'2022-08-11',location:'湖州沈家本历史文化园',status:'past'},
      // ── 自动搜索新增（2026-06-29）──────────────────────────
      {title:'浙江瀛立律师事务所「复盘、迭代、致远」年终文化活动暨总结大会',desc:'浙江瀛立律师事务所在湖州沈家本历史文化园举办别具意义的年终活动，全体律师首先参观沈家本历史文化园感受法治文化底蕴，随后开展「复盘、迭代、致远」主题年终总结。',category:'文化活动',eventDate:'2026-01-30',location:'湖州沈家本历史文化园',status:'past'},
      {title:'承法治初心 聚巾帼力量——湖州市律协女律师联谊会2026年度工作会议',desc:'湖州市律协女律师联谊会2026年度第一次工作会议在沈家本历史文化园顺利召开，全体参会人员参观园区沉浸式感受中国近代法治文化深厚底蕴，随后围绕年度工作规划与女律师执业发展等议题展开深入研讨。',category:'文化活动',eventDate:'2026-02-28',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州师范学院科研处党支部、工会党支部参观沈家本历史文化园',desc:'湖州师范学院科研处党支部与工会党支部组织党员参观沈家本历史文化园，依次参观园区六部分核心展陈，深入了解沈家本在法治领域的卓越贡献，体悟法治思想代代延续，将法治精神转化为服务学校高质量发展的实际行动。',category:'党建活动',eventDate:'2025-11-12',location:'湖州沈家本历史文化园',status:'past'},
      {title:'2026年第一期中青二班一支部赴湖州开展党日活动',desc:'2026年第一期中青年干部培训二班一支部赴湖州市吴兴区妙西镇开展党日活动，在沈家本历史文化园通过沉浸式多媒体展陈深刻体悟沈家本修律思想与法治精神，实地考察法治护航乡村振兴与文旅融合赋能生态共富的先进做法。',category:'党建活动',eventDate:'2026-05-10',location:'湖州沈家本历史文化园',status:'past'},
      {title:'湖州市吴兴区第一小学党支部赴沈家本历史文化园开展主题党日活动',desc:'湖州市吴兴区第一小学党支部在沈家本历史文化园开展5月主题党日活动，在家本广场宣誓墙前全体党员教师整齐列队面向鲜红党旗重温入党誓词，激励每一位党员永葆初心。',category:'党建活动',eventDate:'2026-05-20',location:'湖州沈家本历史文化园',status:'past'},
    ];
    for (const e of events) {
      db.insert('events', {
        title: e.title, description: e.desc, category: e.category,
        eventDate: e.eventDate, location: e.location, status: e.status,
        coverImage: '', maxParticipants: e.maxParticipants || 120,
        registrationDeadline: e.status === 'upcoming' ? new Date(new Date(e.eventDate).getTime() - 3*86400000).toISOString().split('T')[0] : '',
        isActive: true,
      });
    }
    db.save();
  }

  // ── 成果出版物 ────────────────────────────────────
  if (db.table('publications').length === 0) {
    console.log('  生成出版物数据...');
    const pubs = [
      {title:'《沈家本手稿五种》（影印本）',author:'湖州市沈家本研究院 编',category:'文献影印',year:2022,desc:'五册一函，杭州华宝斋书社2022年6月影印出版。收录沈家本日记、书札、律学笔记等未刊手稿，为中国法学界首度披露部分珍贵文献。',publisher:'杭州华宝斋书社'},
      {title:'《玉骨冰心冷不摧——沈家本诗集》',author:'沈家本研究院 编',category:'文献整理',year:2020,desc:'纪念沈家本诞辰180周年专题出版物，汇集沈家本生平诗作及学界纪念文章。',publisher:'沈家本研究院'},
      {title:'《沈家本与中国法律文化论集》',author:'研究院学术委员会 编',category:'论文集',year:2021,desc:'第二届沈家本与中国法律文化学术研讨会论文精选集，140余位学者成果汇编。',publisher:'法律出版社'},
      {title:'《历代刑法考（校注版）》',author:'沈家本 著 / 研究院 校注',category:'校注',year:2025,desc:'沈家本代表作《历代刑法考》的现代校注版本。',publisher:'法律出版社'},
      {title:'《寄簃文存校注》',author:'研究院文献史料中心',category:'校注',year:2025,desc:'沈家本法学文集的整理与校注。',publisher:'待定'},
      {title:'《会通中西：沈家本法律思想研究》',author:'学术研究部',category:'专著',year:2024,desc:'研究院核心课题成果，系统梳理沈家本"会通中西、慎刑恤狱、定分止争、契约为本"核心法治理念。',publisher:'待定'},
      {title:'《商事调解案例汇编（第一辑）》',author:'商事调解研究中心',category:'案例汇编',year:2026,desc:'精选商事调解典型案例及评析，涵盖买卖合同、知识产权、电商经营等领域。',publisher:'待定'},
      {title:'沈家本法学研究（学术期刊·半年刊）',author:'研究院编辑部',category:'期刊',year:2025,desc:'专注于沈家本研究及法律史学领域，刊登海内外最新研究成果。',publisher:'沈家本研究院'},
      {title:'《法治数据智能研究报告（2025年度）》',author:'数据法治研究所',category:'报告',year:2026,desc:'法律数据聚合平台年度数据分析与趋势研判。',publisher:'待定'},
      {title:'《中国传统法律文化的现代价值》',author:'学术研究部',category:'专著',year:2026,desc:'挖掘传统法律文化中可资借鉴的理念与制度资源。',publisher:'待定'},
    ];
    const coverMap = {
      '《沈家本手稿五种》（影印本）': 'assets/images/publications/pub-001.png',
      '《玉骨冰心冷不摧——沈家本诗集》': 'assets/images/publications/pub-002.png',
      '《沈家本与中国法律文化论集》': 'assets/images/publications/pub-003.png',
      '《历代刑法考（校注版）》': 'assets/images/publications/pub-004.png',
      '《寄簃文存校注》': 'assets/images/publications/pub-005.png',
      '《会通中西：沈家本法律思想研究》': 'assets/images/publications/pub-006.png',
      '《商事调解案例汇编（第一辑）》': 'assets/images/publications/pub-007.png',
      '沈家本法学研究（学术期刊·半年刊）': 'assets/images/publications/pub-008.png',
      '《法治数据智能研究报告（2025年度）》': 'assets/images/publications/pub-009.png',
      '《中国传统法律文化的现代价值》': 'assets/images/publications/pub-010.png',
    };
    for (const p of pubs) {
      db.insert('publications', {
        title: p.title, author: p.author, category: p.category,
        year: p.year, description: p.desc,
        coverImage: coverMap[p.title] || '',
        publisher: p.publisher,
        isbn: '',
        isActive: true,
      });
    }
    db.save();
  }

  // ── 专家委员会 ────────────────────────────────────
  if (!db.find('content_pages', { key: 'expert_committee' })) {
    console.log('  生成专家委员会数据...');
    db.insert('content_pages', {
      key: 'expert_committee',
      isActive: true,
      data: {
        series: [
          {
            name: '（一）传统法治文化系列',
            description: '深耕沈家本修律思想、传统法治智慧与现代商事调解的融合路径，推动法治文化IP的数字化传播。',
            centers: [
              { name: '沈家本修律思想与现代法治改革研究中心', expertName: '蒋惠岭', expertTitle: '同济大学法学院院长', expertAvatar: 'assets/images/expert-jianghuiling.jpg', centerIntro: '系统研究沈家本修律思想及其对当代法治改革的启示，推动近代法学遗产的创造性转化与制度衔接。', expertBio: '同济大学法学院院长、教授、博士生导师，沈家本研究院兼职院长。曾任最高人民法院高级法官、司法改革办公室负责人，长期从事司法制度、调解制度、法治改革研究。', isVacant: false },
              { name: '传统法治智慧与商事调解研究中心', expertName: '', expertTitle: '', centerIntro: '挖掘中国传统法律文化中的调解智慧，探索本土化商事纠纷多元化解机制的理论基础与实践路径。', expertBio: '', isVacant: true },
              { name: '法治文化IP智慧传播研究中心', expertName: '', expertTitle: '', centerIntro: '以数字化、文创化手段传播沈家本法治文化，打造具有影响力的法治文化IP品牌与教育产品矩阵。', expertBio: '', isVacant: true }
            ]
          },
          {
            name: '（二）前沿科技与智慧法治系列',
            description: '聚焦人工智能、数字经济、先进制造等前沿领域的法治保障与规则构建。',
            centers: [
              { name: '人工智能与数智产业法治研究中心', expertName: '', expertTitle: '', centerIntro: '研究AI伦理法律规制、算法治理、自动驾驶与智能合约等前沿数字产业的法治保障与合规框架。', expertBio: '', isVacant: true },
              { name: '数字经济与数据要素法治研究中心', expertName: '王俊峰', expertTitle: '沈家本研究院专职院长', expertAvatar: 'assets/images/expert-wangjunfeng.jpg', centerIntro: '围绕数据产权、跨境流动、平台治理、个人信息保护等核心议题，提供政策研究与合规解决方案。', expertBio: '中国政法大学本科，香港城市大学法学硕博。曾任职腾讯、阿里法务管理岗，深耕数字法治、数据合规、网络安全立法领域。', isVacant: false },
              { name: '先进制造与产业链供应链法治研究中心', expertName: '', expertTitle: '', centerIntro: '聚焦先进制造业知识产权保护、产业链供应链安全审查、国际贸易合规等法治保障议题。', expertBio: '', isVacant: true }
            ]
          },
          {
            name: '（三）公司治理与困境应对系列',
            description: '为企业提供贯穿全生命周期的公司治理、破产重整与不动产法律服务。',
            centers: [
              { name: '企业破产重整与特殊资产治理研究中心', expertName: '', expertTitle: '', centerIntro: '研究破产重整法律实务、特殊资产处置与困境企业救助机制，为区域经济高质量发展提供法治护航。', expertBio: '', isVacant: true },
              { name: '商事组织与现代公司治理研究中心', expertName: '陈纪钢', expertTitle: '北京大成（杭州）律师事务所', expertAvatar: 'assets/images/expert-chenjigang.png', centerIntro: '研究公司法修订、股权架构设计、公司治理合规、投融资法律实务，为企业现代化治理提供学术与实务支持。', expertBio: '北京大成（杭州）律师事务所资深合伙人，长期从事公司治理、股权纠纷、企业并购重组法律业务。', isVacant: false },
              { name: '不动产与现代基础设施研究中心', expertName: '底世清', expertTitle: '北京炜衡（杭州）律师事务所', expertAvatar: 'assets/images/expert-dishiqing.png', centerIntro: '聚焦房地产、建设工程、城市更新与现代基础设施投融资法律实务，推动不动产领域的合规创新。', expertBio: '北京炜衡（杭州）律师事务所高级合伙人，深耕不动产与建设工程法律服务领域逾二十年。', isVacant: false },
              { name: '产业发展研究中心', expertName: '姚剑', expertTitle: '高级经济师、法学博士', expertAvatar: '', centerIntro: '聚焦产业政策法治保障、产业链合规风险防控、产业园区法治化治理等领域，为区域产业高质量发展提供法治智力支撑。', expertBio: '具备经济学与法学交叉学科背景，长期从事产业经济法治保障研究与企业投资并购合规实务，曾任大型产业集团法务负责人。', isVacant: false }
            ]
          },
          {
            name: '（四）行政合规与多元解纷系列',
            description: '推动政企合规、民营经济保护、多元争议解决机制的理论研究与实务创新。',
            centers: [
              { name: '法治政府与政企关系合规研究中心', expertName: '', expertTitle: '', centerIntro: '研究法治政府建设评价体系、政企关系合规路径、行政程序法治化等重大理论课题。', expertBio: '', isVacant: true },
              { name: '民营经济保护与刑事风险防控研究中心', expertName: '金林蔚', expertTitle: '浙江泽大律师事务所', expertAvatar: 'assets/images/expert-jinlinwei.png', centerIntro: '围绕民营企业家权益保护、企业刑事合规、经济犯罪风险防控等领域开展系统性研究。', expertBio: '浙江泽大律师事务所合伙人，专注刑事辩护与企业刑事合规，办理多起重大经济犯罪案件。', isVacant: false },
              { name: '商事仲裁与多元争议解决研究中心', expertName: '殷飞', expertTitle: '浙江合飞律师事务所', expertAvatar: 'assets/images/expert-yinfei.png', centerIntro: '对标国际商事仲裁规则，研究诉讼、仲裁、调解等多元争议解决机制的融合应用与制度创新。', expertBio: '浙江合飞律师事务所主任，在商事仲裁、建设工程纠纷解决领域具有丰富实务经验。', isVacant: false },
              { name: '湖州律师促进中心', expertName: '何秋慧', expertTitle: '湖州汉本律师事务所', expertAvatar: 'assets/images/expert-heqiuhui.png', centerIntro: '聚焦湖州律师行业专业化提升与青年律师培育，推动律师调解、法律援助、公益普法等公共法律服务体系建设。', expertBio: '湖州汉本律师事务所律师，长期扎根湖州法律实务一线，专注民商事诉讼与法律顾问服务，为研究院提供本地实务支撑。', isVacant: false }
            ]
          }
        ]
      }
    });
    db.save();
  }

  // 基础内容
  if (db.table('basic_content').length === 0) {
    db.insert('basic_content', { contentKey: 'about_intro', title: '研究院简介', contentValue: '湖州市沈家本研究院坐落于吴兴西塞山旅游度假区妙西镇沈家本历史文化园内，2020年11月经湖州市民政局正式登记注册，是湖州地区唯一以系统研究、整理、传播近代法制奠基人沈家本法治思想为核心职能的非营利性学术研究机构。', isPublished: true, orderIndex: 1 });
    db.insert('basic_content', { contentKey: 'about_mission', title: '办院宗旨', contentValue: '传承沈家本法学精神，深耕中华优秀传统法律文化，打造集文献整理、学术研究、校地协同、商事调解、法治研学、实务服务于一体的特色法治智库平台。', isPublished: true, orderIndex: 2 });
    db.insert('basic_content', { contentKey: 'contact_address', title: '单位地址', contentValue: '浙江省湖州市吴兴区妙西镇沈家本历史文化园', isPublished: true, orderIndex: 1 });
    db.insert('basic_content', { contentKey: 'contact_phone', title: '联系电话', contentValue: '13082838161（王主任）', isPublished: true, orderIndex: 2 });
    db.insert('basic_content', { contentKey: 'contact_email', title: '电子邮箱', contentValue: 'info@hz-shenjiaben.org', isPublished: true, orderIndex: 3 });
    db.save();
  }

  const stats = {
    lawyer_discipline: db.table('lawyer_discipline').length,
    legislation_projects: db.table('legislation_projects').length,
    judicial_cases: db.table('judicial_cases').length,
    judicial_policies: db.table('judicial_policies').length,
    legal_recruitments: db.table('legal_recruitments').length,
    events: db.table('events').length,
    publications: db.table('publications').length,
  };
  console.log('种子数据统计:', JSON.stringify(stats));
  return stats;
}

// 直接执行
if (require.main === module) {
  seed();
}

module.exports = { seed };

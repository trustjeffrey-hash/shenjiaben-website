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
      const year = 2024 + Math.floor(Math.random() * 2);
      const month = Math.floor(Math.random() * 12);
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
    ];
    for (const p of projects) {
      const baseDate = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
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
    ];
    for (const c of cases) {
      const ruling = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
      const filing = new Date(ruling.getTime() - Math.floor(Math.random() * 365 + 30) * 86400000);
      db.insert('judicial_cases', {
        caseTitle: c.title, caseNumber: `（2024）法${100 + Math.floor(Math.random() * 900)}号`,
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
    ];
    for (const p of policies) {
      const pubDate = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
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

  // 法律招聘
  if (db.table('legal_recruitments').length === 0) {
    console.log('  生成法律招聘数据...');
    const cities = ['北京','上海','深圳','广州','杭州','成都','南京','武汉','西安','重庆'];
    const jobTypes = ['律师','法务','合规','知识产权','实习律师','律师助理','法律顾问'];
    const salaries = ['8K-12K','12K-20K','20K-35K','35K-50K','50K-80K','面议'];
    const companies = ['金杜律师事务所','中伦律师事务所','君合律师事务所','腾讯法务部','阿里巴巴法务部','字节跳动法务部','华为法务部','美团法务部','方达律师事务所','海问律师事务所'];
    for (let i = 0; i < 50; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const pubDate = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
      db.insert('legal_recruitments', {
        title: `【${city}】${company}招聘${jobType}`,
        company, city, jobType,
        salaryRange: salaries[Math.floor(Math.random() * salaries.length)],
        experience: ['1-3年','3-5年','5年以上','不限'][Math.floor(Math.random() * 4)],
        education: ['本科','硕士','博士','不限'][Math.floor(Math.random() * 4)],
        description: `${company}现面向社会公开招聘${jobType}，工作地点${city}，要求法学专业背景。`,
        requirements: '1. 法学本科及以上学历\n2. 通过法律职业资格考试\n3. 良好的沟通能力',
        wechatAccount: ['法律招聘','律所直聘','法律求职'][Math.floor(Math.random() * 3)],
        wechatArticleUrl: `https://mp.weixin.qq.com/s/demo_${i}`,
        originalUrl: `https://www.zhipin.com/job_detail/demo_${i}.html`,
        publishDate: pubDate.toISOString(),
        isActive: true,
        dataHash: require('crypto').createHash('sha256').update(`${company}${jobType}${city}${pubDate.toISOString()}`).digest('hex'),
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
    for (const p of pubs) {
      db.insert('publications', {
        title: p.title, author: p.author, category: p.category,
        year: p.year, description: p.desc,
        coverImage: '', publisher: p.publisher,
        isbn: '',
        isActive: true,
      });
    }
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

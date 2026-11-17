export interface BlueprintTemplate {
  id: 'robot' | 'account' | 'hero';
  className: string;
  title: string;
  subtitle: string;
  classAttrName: string;
  classAttrDefault: string | number;
  countAttrName: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select';
    defaultValue: string | number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: string[];
  }[];
  methods: {
    name: string;
    label: string;
    description: string;
    codeLine: (varName: string) => string;
  }[];
  sourceCode: string;
}

export const BLUEPRINT_TEMPLATES: BlueprintTemplate[] = [
  {
    id: 'robot',
    className: 'Robot',
    title: '機器人藍圖',
    subtitle: '以製造工廠比喻類別與多個獨立運作的機器人實例',
    classAttrName: 'manufacturer',
    classAttrDefault: '"PyLab Works"',
    countAttrName: 'total_robots',
    fields: [
      { name: 'name', label: '機器人名稱 (name)', type: 'text', defaultValue: 'Atlas' },
      { name: 'energy', label: '初始電量 (energy)', type: 'number', defaultValue: 80, min: 0, max: 100, step: 5, unit: '%' },
      { name: 'role', label: '任務類型 (role)', type: 'select', defaultValue: 'Explorer', options: ['Explorer', 'Builder', 'Scanner'] },
    ],
    methods: [
      {
        name: 'work',
        label: '執行任務 work()',
        description: '消耗 20% 電量並記錄任務狀態',
        codeLine: (v) => `${v}.work()`,
      },
      {
        name: 'charge',
        label: '快速充電 charge()',
        description: '補充電量至最多 100%',
        codeLine: (v) => `${v}.charge()`,
      },
    ],
    sourceCode: `class Robot:
    manufacturer = "PyLab Works"   # 類別屬性 (全體共享)
    total_robots = 0               # 追蹤已建立實例數量

    def __init__(self, name, energy=80, role="Explorer"):
        self.name = name           # 實例屬性 (每個物件獨立)
        self.energy = energy
        self.role = role
        Robot.total_robots += 1

    def work(self):
        if self.energy >= 20:
            self.energy -= 20
            return f"{self.name} 完成任務，剩餘電量 {self.energy}%"
        return f"{self.name} 電量不足，請先充電"

    def charge(self):
        self.energy = min(100, self.energy + 30)
        return f"{self.name} 充電完成，目前電量 {self.energy}%"`,
  },
  {
    id: 'account',
    className: 'BankAccount',
    title: '銀行帳戶藍圖',
    subtitle: '每個帳戶實例各自持有獨立餘額，互不干擾',
    classAttrName: 'bank_name',
    classAttrDefault: '"PyBank"',
    countAttrName: 'total_accounts',
    fields: [
      { name: 'owner', label: '戶名 (owner)', type: 'text', defaultValue: 'Mia' },
      { name: 'balance', label: '開戶金額 (balance)', type: 'number', defaultValue: 1000, min: 0, max: 5000, step: 100, unit: 'NTD' },
      { name: 'tier', label: '帳戶等級 (tier)', type: 'select', defaultValue: 'Standard', options: ['Standard', 'Premier', 'Student'] },
    ],
    methods: [
      {
        name: 'deposit',
        label: '存款 +500 deposit(500)',
        description: '將 500 元存入此實例的 balance',
        codeLine: (v) => `${v}.deposit(500)`,
      },
      {
        name: 'withdraw',
        label: '提款 -300 withdraw(300)',
        description: '檢查餘額足夠後扣除 300 元',
        codeLine: (v) => `${v}.withdraw(300)`,
      },
    ],
    sourceCode: `class BankAccount:
    bank_name = "PyBank"           # 類別屬性 (全行一致)
    total_accounts = 0

    def __init__(self, owner, balance=1000, tier="Standard"):
        self.owner = owner         # 實例屬性 (專屬此帳戶)
        self.balance = balance
        self.tier = tier
        BankAccount.total_accounts += 1

    def deposit(self, amount):
        self.balance += amount
        return f"{self.owner} 存入 {amount}，餘額 {self.balance}"

    def withdraw(self, amount):
        if self.balance >= amount:
            self.balance -= amount
            return f"{self.owner} 提領 {amount}，餘額 {self.balance}"
        return f"{self.owner} 餘額不足"`,
  },
  {
    id: 'hero',
    className: 'Hero',
    title: '遊戲角色藍圖',
    subtitle: '透過單一角色類別產生不同職業與血量的玩家物件',
    classAttrName: 'world',
    classAttrDefault: '"Aethelgard"',
    countAttrName: 'total_heroes',
    fields: [
      { name: 'name', label: '角色名稱 (name)', type: 'text', defaultValue: 'Kael' },
      { name: 'hp', label: '生命值 (hp)', type: 'number', defaultValue: 120, min: 20, max: 200, step: 10, unit: 'HP' },
      { name: 'job', label: '職業 (job)', type: 'select', defaultValue: 'Knight', options: ['Knight', 'Mage', 'Ranger'] },
    ],
    methods: [
      {
        name: 'take_damage',
        label: '受到攻擊 take_damage(25)',
        description: '減少 25 點 HP 直到 0 為止',
        codeLine: (v) => `${v}.take_damage(25)`,
      },
      {
        name: 'heal',
        label: '施放治療 heal(20)',
        description: '恢復 20 點生命值',
        codeLine: (v) => `${v}.heal(20)`,
      },
    ],
    sourceCode: `class Hero:
    world = "Aethelgard"           # 類別屬性
    total_heroes = 0

    def __init__(self, name, hp=120, job="Knight"):
        self.name = name           # 實例屬性
        self.hp = hp
        self.job = job
        Hero.total_heroes += 1

    def take_damage(self, dmg):
        self.hp = max(0, self.hp - dmg)
        return f"{self.name} 受到 {dmg} 傷害，HP: {self.hp}"

    def heal(self, amount):
        self.hp = min(200, self.hp + amount)
        return f"{self.name} 恢復 {amount} 生命，HP: {self.hp}"`,
  },
];

export interface LookupStep {
  id: number;
  code: string;
  title: string;
  explanation: string;
  highlightTarget: 'instance_a' | 'instance_b' | 'class_dict' | 'lookup_path';
  instanceADict: Record<string, string>;
  instanceBDict: Record<string, string>;
  classDict: Record<string, string>;
  resultText: string;
}

export const ATTRIBUTE_LOOKUP_STEPS: LookupStep[] = [
  {
    id: 0,
    code: 'a = Dog("Mochi")\nb = Dog("Boba")',
    title: '步驟 1：建立兩個實例',
    explanation: '執行 __init__ 後，a 與 b 各自的 __dict__ 只有 name 屬性；species 則保存在 Dog 類別的 __dict__ 中共享。',
    highlightTarget: 'instance_a',
    instanceADict: { name: '"Mochi"' },
    instanceBDict: { name: '"Boba"' },
    classDict: { species: '"Canis"', tricks: '[]' },
    resultText: 'a.__dict__ = {"name": "Mochi"}',
  },
  {
    id: 1,
    code: 'print(a.species)',
    title: '步驟 2：讀取類別屬性 (查找鏈)',
    explanation: 'Python 先檢查 a.__dict__ 找不到 species，於是自動往上查找 Dog.__dict__，成功讀到 "Canis"。',
    highlightTarget: 'lookup_path',
    instanceADict: { name: '"Mochi"' },
    instanceBDict: { name: '"Boba"' },
    classDict: { species: '"Canis"', tricks: '[]' },
    resultText: '輸出："Canis" (來自 Dog.__dict__)',
  },
  {
    id: 2,
    code: 'a.species = "Arctic Wolf"',
    title: '步驟 3：實例屬性遮蔽 (Shadowing)',
    explanation: '對實例進行「賦值 (=)」會在 a.__dict__ 新增一個專屬鍵值，不會改動 Dog.__dict__，因此 b.species 仍是 "Canis"。',
    highlightTarget: 'instance_a',
    instanceADict: { name: '"Mochi"', species: '"Arctic Wolf"' },
    instanceBDict: { name: '"Boba"' },
    classDict: { species: '"Canis"', tricks: '[]' },
    resultText: 'a.species -> "Arctic Wolf" · b.species -> "Canis"',
  },
  {
    id: 3,
    code: 'a.tricks.append("Sit")',
    title: '步驟 4：可變類別屬性陷阱',
    explanation: '注意！呼叫 .append() 並不是賦值 (=)，而是直接修改 Dog.__dict__ 裡的同一個 list，導致 b.tricks 也跟著變了！',
    highlightTarget: 'class_dict',
    instanceADict: { name: '"Mochi"', species: '"Arctic Wolf"' },
    instanceBDict: { name: '"Boba"' },
    classDict: { species: '"Canis"', tricks: '["Sit"]' },
    resultText: '警告：b.tricks 竟也變成 ["Sit"]！(應於 __init__ 初始化 self.tricks = [])',
  },
];

export interface CodingChallenge {
  id: string;
  number: string;
  title: string;
  concept: string;
  difficulty: string;
  prompt: string;
  starterCode: string;
  hint: string;
  solutionCode: string;
  testScript: string;
  expectedOutput: string[];
}

export const CODING_CHALLENGES: CodingChallenge[] = [
  {
    id: 'c1',
    number: '01',
    title: '設計Book類別與__init__建構子',
    concept: '類別定義與實例屬性綁定',
    difficulty: '基礎',
    prompt: '請定義一個 Book 類別，在 __init__(self, title, pages) 中將傳入的書名與頁數存為實例屬性 self.title 與 self.pages，並實作 info(self) 方法回傳格式為 "《書名》共 X 頁" 的字串。',
    starterCode: `class Book:
    def __init__(self, title, pages):
        # 請將 title 與 pages 綁定到 self
        pass

    def info(self):
        # 請回傳 "《{self.title}》共 {self.pages} 頁"
        pass
`,
    hint: '在 __init__ 中使用 self.title = title 與 self.pages = pages；在 info(self) 中 return f"《{self.title}》共 {self.pages} 頁"。',
    solutionCode: `class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages

    def info(self):
        return f"《{self.title}》共 {self.pages} 頁"
`,
    testScript: `b1 = Book("Python 設計模式", 320)
b2 = Book("演算法圖鑑", 208)
print(b1.info())
print(b2.info())`,
    expectedOutput: ['《Python 設計模式》共 320 頁', '《演算法圖鑑》共 208 頁'],
  },
  {
    id: 'c2',
    number: '02',
    title: '實作狀態變更方法與類別計數器',
    concept: 'self 狀態更新與類別屬性',
    difficulty: '進階',
    prompt: '請完成 Counter 類別：類別屬性 total_created 初始為 0，每次建立實例時自動 +1；實例屬性 self.value 初始為 start（預設 0），並實作 increment(self, step=1) 方法將 self.value 加上 step。',
    starterCode: `class Counter:
    total_created = 0

    def __init__(self, start=0):
        # 綁定 self.value 並遞增 Counter.total_created
        pass

    def increment(self, step=1):
        # 將 self.value 增加 step
        pass
`,
    hint: '務必使用 Counter.total_created += 1（若寫成 self.total_created += 1 只會建立實例屬性而不會累加類別計數器）。',
    solutionCode: `class Counter:
    total_created = 0

    def __init__(self, start=0):
        self.value = start
        Counter.total_created += 1

    def increment(self, step=1):
        self.value += step
`,
    testScript: `c1 = Counter(10)
c2 = Counter()
c1.increment(5)
c2.increment()
print(c1.value)
print(c2.value)
print(Counter.total_created)`,
    expectedOutput: ['15', '1', '2'],
  },
  {
    id: 'c3',
    number: '03',
    title: '使用 super() 擴充父類別',
    concept: '繼承、super().__init__ 與方法覆寫',
    difficulty: '進階',
    prompt: '已有父類別 Employee(name, salary)。請建立子類別 Manager(Employee)，在 __init__(self, name, salary, bonus) 中呼叫 super().__init__(name, salary) 並新增 self.bonus = bonus；覆寫 total_pay(self) 回傳 salary + bonus。',
    starterCode: `class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def total_pay(self):
        return self.salary

class Manager(Employee):
    def __init__(self, name, salary, bonus):
        # 呼叫父類別建構子並設定 bonus
        pass

    def total_pay(self):
        # 回傳底薪加獎金
        pass
`,
    hint: '使用 super().__init__(name, salary) 讓父類別初始化 self.name 與 self.salary，再用 return super().total_pay() + self.bonus 或 self.salary + self.bonus。',
    solutionCode: `class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def total_pay(self):
        return self.salary

class Manager(Employee):
    def __init__(self, name, salary, bonus):
        super().__init__(name, salary)
        self.bonus = bonus

    def total_pay(self):
        return self.salary + self.bonus
`,
    testScript: `e = Employee("Alex", 45000)
m = Manager("Grace", 65000, 15000)
print(e.name, e.total_pay())
print(m.name, m.total_pay())`,
    expectedOutput: ['Alex 45000', 'Grace 80000'],
  },
  {
    id: 'c4',
    number: '04',
    title: '使用 @property 保護屬性驗證',
    concept: '封裝與 Getter / Setter 防呆',
    difficulty: '挑戰',
    prompt: '請完成 Thermostat 類別，使用私有屬性 self._celsius 儲存溫度。實作 @property def celsius(self) 回傳 _celsius，以及 @celsius.setter 在 value < -273.15 時 raise ValueError("低於絕對零度")，否則更新 self._celsius。',
    starterCode: `class Thermostat:
    def __init__(self, celsius=25):
        self._celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        # 若 value < -273.15 請 raise ValueError("低於絕對零度")
        pass
`,
    hint: '在 setter 裡面寫：\nif value < -273.15:\n    raise ValueError("低於絕對零度")\nself._celsius = value',
    solutionCode: `class Thermostat:
    def __init__(self, celsius=25):
        self._celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("低於絕對零度")
        self._celsius = value
`,
    testScript: `t = Thermostat(22)
t.celsius = 30
print(t.celsius)
try:
    t.celsius = -300
except ValueError as err:
    print(err)`,
    expectedOutput: ['30', '低於絕對零度'],
  },
];

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    topic: 'self 參數機制',
    question: '在 Python 類別的方法定義中，第一個參數通常命名為 self，它代表什麼？',
    codeSnippet: `class Cat:
    def meow(self):
        return f"{self.name} says meow"`,
    options: [
      '指向類別本身（Cat），用於修改類別定義',
      '指向目前呼叫該方法的物件實例本身，讓方法能存取該實例的屬性',
      'Python 的保留關鍵字，不可更改為其他名稱',
      '代表上一次建立的實例參考',
    ],
    correctIndex: 1,
    explanation: '當執行 kitty.meow() 時，Python 會自動將 kitty 作為第一個引數傳入 meow(self)，讓函式內部能透過 self 讀取或寫入該實例的屬性。self 並非保留字，但遵循 PEP 8 慣例皆命名為 self。',
  },
  {
    id: 'q2',
    topic: '類別屬性 vs 實例屬性',
    question: '執行以下程式碼後，最後一行 print(b.count) 的輸出結果為何？',
    codeSnippet: `class Box:
    count = 10

a = Box()
b = Box()
a.count = 99
print(b.count)`,
    options: ['99', '10', '0', '發生 AttributeError 錯誤'],
    correctIndex: 1,
    explanation: 'a.count = 99 是在實例 a 的 __dict__ 中新增了一個實例屬性 count，遮蔽了類別屬性；Box.count 與實例 b 的查找結果仍然維持 10。',
  },
  {
    id: 'q3',
    topic: '名稱修飾 (Name Mangling)',
    question: '在類別中使用雙底線開頭定義屬性 self.__pin = 1234 時，Python 實際會將它改名為什麼？',
    options: [
      '完全隱藏，記憶體中無法以任何方式讀取',
      '_pin',
      '_類別名稱__pin（例如 _Account__pin）',
      '__Account_pin',
    ],
    correctIndex: 2,
    explanation: '雙底線前綴（且尾端無雙底線）會觸發 Python 的 Name Mangling 機制，自動轉換為 _ClassName__attrName，藉此避免子類別意外覆寫或外部直接誤觸，但並非絕對不可存取的加密。',
  },
  {
    id: 'q4',
    topic: '繼承與 super()',
    question: '在子類別的 __init__ 中呼叫 super().__init__(...) 的主要目的是什麼？',
    options: [
      '刪除父類別原有的屬性以節省記憶體',
      '沿著 MRO 順序呼叫父類別的初始化邏輯，確保繼承來的實例屬性正確建立',
      '將子類別轉換成靜態方法',
      '讓父類別自動獲得子類別的新屬性',
    ],
    correctIndex: 1,
    explanation: '如果子類別覆寫了 __init__ 卻沒有呼叫 super().__init__()，父類別的初始化程式碼就不會執行，導致父類別設定的 self 屬性缺失。',
  },
  {
    id: 'q5',
    topic: '多型 (Polymorphism)',
    question: '以下哪一個敘述最能準確描述 Python 中的多型（Polymorphism）？',
    options: [
      '一個類別只能有一個方法名稱，不能重複定義',
      '不同類別的物件只要實作了相同名稱的方法介面（例如 .speak()），就能在同一個迴圈中被統一呼叫並展現各自行為',
      '所有變數都必須事先宣告明確的靜態型別',
      '子類別不能修改父類別已經定義好的方法',
    ],
    correctIndex: 1,
    explanation: 'Python 支援鴨子型別（Duck Typing）與繼承覆寫的多型：呼叫端只需面對統一的方法介面（如 entity.speak()），實際執行行為則依物件所屬類別動態決定。',
  },
  {
    id: 'q6',
    topic: '@property 裝飾器',
    question: '使用 @property 與 @attr.setter 裝飾器的最大優點是什麼？',
    options: [
      '讓外部呼叫端仍可用 obj.attr 語法讀寫屬性，同時在背後加入資料驗證或計算邏輯',
      '讓程式執行速度比一般屬性快十倍',
      '可以省略 __init__ 建構子不寫',
      '強制所有屬性變成唯讀常數，永遠無法修改',
    ],
    correctIndex: 0,
    explanation: '@property 讓我們能在不破壞外部「點語法（obj.balance = 500）」習慣的前提下，將屬性存取導向 getter / setter 方法，安全地檢查數值範圍或計算衍生值。',
  },
];

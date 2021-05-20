// 原案: Merino 氏
// プログラミング: xxx (ティラミス)

// サーバーサイドで文字列チェックをしっかりする前提の実装が多々あります(特にinnerHTML使用など)。
// また、ファイルの排他制御なども考慮されていません。
// オンライン化する場合は注意。

// UTF-8の冗長表現に対応できているか謎

addEventListener("load", () => {

  "use strict";

  // デバッグ用
  // false or undefined にするとデバッグモードじゃなくなる
  const
    $$$___ページ読み込み時にセーブデータを削除する___$$$ = false,
    $$$___新規登録フォームに値を自動入力する___$$$ = true,
    $$$___名前が重複定義されているスキルをコンソールに表示する___$$$ = true
    ;
  // デバッグ用ここまで

  const
    $id = (id) => document.getElementById(id),
    // "最大"-1が実際の最大なので注意(配列中のランダムな要素の取得に便利なので)
    整数乱数 = (最大, 最小 = 0, 端を含める = false) => Math.floor(Math.random() * (最大 - 最小 + (端を含める ? 1 : 0))) + 最小,
    確率 = (確率) => Math.random() < 確率,
    ランダムな1要素 = (配列) => 配列[整数乱数(配列.length)],
    半角か = new RegExp(/[ -~]/),
    全角を2とした文字列長 = (文字列) => {
      let 文字列長 = 0;
      for (const 文字 of 文字列) {
        文字列長 += 半角か.test(文字) ? 1 : 2;
      }
      return 文字列長;
    },
    空配列 = Object.freeze([]),
    空文字列 = Object.freeze(""),
    $encode = (文字列) => 文字列.replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"),
    テーブル行出力 = (項目名リスト, クリック時文字列, ヘッダー行か) => {
      const tr = document.createElement("tr");
      for (const 項目名 of 項目名リスト) {
        const セル = document.createElement(ヘッダー行か ? "th" : "td");
        if (項目名.nodeType !== undefined) {
          セル.appendChild(項目名);
        }
        else {
          セル.textContent = 項目名;
        }
        tr.appendChild(セル);
      }
      チャットフォーム.文字列追加イベントを登録(tr, クリック時文字列);
      return tr;
    },
    強調テキスト = (...非強調テキストと強調テキストの繰り返し) => {
      const
        断片 = document.createDocumentFragment();
      let 強調する = 0;
      for (const テキスト of 非強調テキストと強調テキストの繰り返し) {
        if (強調する++ % 2 === 0) {
          if (テキスト !== undefined) {
            断片.appendChild(document.createTextNode(テキスト));
          }
          continue;
        }
        断片.appendChild(クラス付きテキスト("強調", テキスト));
      }
      return 断片;
    },
    クラス付きテキスト = (クラス, テキスト) => {
      const span = document.createElement("span");
      span.classList.add(クラス);
      span.textContent = テキスト;
      return span;
    }
    ;

  class 範囲 {
    constructor(から, まで = 0, 刻み = 1) {
      刻み = Math.abs(刻み) * Math.sign(まで - から);
      this.#段階数 = から === まで ? 1 : Math.round((まで - から) / 刻み) + 1;
      if (から + 刻み * (this.#段階数 - 1) !== まで)
        throw new Error(`範囲(${から}と${まで}の差=${から - まで})が刻み(${刻み})の倍数ではありません`);
      this.#から = から;
      this.#刻み = 刻み;
    }

    ランダム取得() {
      return this.#から + this.#刻み * 整数乱数(this.#段階数);
    }

    *[Symbol.iterator]() {
      for (let i = 0; i < this.#段階数; i += 1) {
        yield this.#から + this.#刻み * i;
      }
    }

    get 候補数() {
      return this.#段階数;
    }

    #から;
    #刻み;
    #段階数;
  }


  class 連続 {
    constructor(値, 数) {
      if (!Number.isInteger(数))
        throw new TypeError(`${数}は整数でなければいけません`);
      this.#値 = 値;
      this.#数 = 数;
    }

    *[Symbol.iterator]() {
      for (let i = 0; i < this.#数; i += 1) {
        yield this.#値;
      }
    }

    #値;
    #数;
  }

  class データベース操作 {
    static 初期化() {
      if ($$$___ページ読み込み時にセーブデータを削除する___$$$) {
        ローカルセーブデータ.removeItem("登録者数");
        indexedDB.deleteDatabase(データベース操作.#データベース名);
        セーブデータ.データベースバージョン.削除();
      }
      const バージョン = セーブデータ.データベースバージョン.取得();
      データベース操作.#バージョン = バージョン;
      const リクエスト = indexedDB.open(データベース操作.#データベース名, バージョン);
      リクエスト.addEventListener("upgradeneeded", データベース操作.#データベースをアップグレード);
      リクエスト.addEventListener("success", データベース操作.#データベースを登録);
    }

    static 新規プレイヤー登録(内容, 軌跡内容) {
      データベース操作.#新規データ群作成(
        { ...データベース操作.#保管庫群.プレイヤー, ...データベース操作.#保管庫群.場所 },
        データベース操作.#保管庫名.プレイヤー一覧,
        内容,
        new Map([[データベース操作.#保管庫群.プレイヤー.プレイヤー軌跡, 軌跡内容]]),
        true
      );
    }

    static プレイヤーを保存(内容) {
      データベース操作.#データの更新または新規追加(データベース操作.#保管庫名.プレイヤー一覧, 内容);
    }

    static プレイヤーを読み込む(名前, コールバック) {
      console.trace(名前);
      const 要求 = データベース操作.#データベース.transaction(データベース操作.#保管庫名.プレイヤー一覧, "readonly")
        .objectStore(データベース操作.#保管庫名.プレイヤー一覧)
        .get(名前);
      要求.addEventListener("success", コールバック);
    }

    static プレイヤーを削除(名前) {
      データベース操作.#データベース.transaction(データベース操作.#保管庫名.プレイヤー一覧, "readwrite")
        .objectStore(データベース操作.#保管庫名.プレイヤー一覧)
        .delete(名前);
      // TODO 保管庫群削除
    }

    static 場所別キャラクターを更新する(場所名, コールバック) {
      データベース操作.#逐次取得と更新(`${場所名}${データベース操作.#保管庫群.場所.キャラクター一覧.接尾辞}`, コールバック);
    }

    static 場所別ログを読み込む(場所名, コールバック) {
      データベース操作.#全取得(`${場所名}${データベース操作.#保管庫群.場所.ログ.接尾辞}`, コールバック);
    }

    static 場所別キャラクター一覧から削除(場所名, 削除キャラクターの場所別IDのリスト) {
      const 対象 = `${場所名}${データベース操作.#保管庫群.場所.キャラクター一覧.接尾辞}`;
      const 保管庫 = データベース操作.#データベース.transaction(対象, "readwrite")
        .objectStore(対象);
      for (const 削除キャラクターの場所別ID of 削除キャラクターの場所別IDのリスト) {
        保管庫.delete(削除キャラクターの場所別ID);
      }
    }

    static 場所別キャラクターの登録または更新(場所名, 追加キャラクター, 追加キャラクターの場所別ID) {
      const 対象 = `${場所名}${データベース操作.#保管庫群.場所.キャラクター一覧.接尾辞}`;
      データベース操作.#データベース.transaction(対象, "readwrite")
        .objectStore(対象)
        // 追加キャラクターの場所別IDがundefinedなら登録、それ以外なら更新になる
        .put(追加キャラクター, 追加キャラクターの場所別ID);
    }

    static 何でも屋の依頼を読み込む(コールバック) {
      データベース操作.#全取得(データベース操作.#保管庫名.何でも屋依頼一覧, コールバック);
    }

    static 何でも屋の依頼を更新(何でも屋の依頼) {
      データベース操作.#データの更新または新規追加(データベース操作.#保管庫名.何でも屋依頼一覧, 何でも屋の依頼);
    }

    static 習得錬金レシピを保存(錬金レシピ, プレイヤーID) {
      データベース操作.#データの更新または新規追加(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.錬金レシピ.接尾辞}`, 錬金レシピ);
    }

    static アイテム図鑑を読み込む(プレイヤーID, コールバック) {
      データベース操作.#全取得(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.アイテム図鑑.接尾辞}`, コールバック);
    }

    static ジョブマスターを読み込む(プレイヤーID, コールバック) {
      データベース操作.#全取得(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.ジョブマス.接尾辞}`, コールバック);
    }

    static プロフィールを読み込む(プレイヤーID, コールバック) {
      データベース操作.#全取得(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.プロフィール.接尾辞}`, コールバック);
    }

    static プロフィールを更新(プレイヤーID, データリスト) {
      const 保管庫名 = `${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.プロフィール.接尾辞}`;
      const 保管庫 = データベース操作.#データベース.transaction(保管庫名, "readwrite")
        .objectStore(保管庫名);
      for (const データ of データリスト) {
        保管庫.put(データ);
      }
    }

    static 新規クエスト登録(内容) {
      データベース操作.#新規データ群作成({ ...データベース操作.#保管庫群.場所, ...データベース操作.#保管庫群.クエスト }, データベース操作.#保管庫名.クエスト一覧, 内容);
    }

    static クエスト保存() {

    }

    static チャットを書き込んでから読み込む(チャット, 場所名, コールバック) {
      データベース操作.#ログを追加(`${場所名}${データベース操作.#保管庫群.場所.ログ.接尾辞}`, チャット, コールバック);
    }

    static 手紙送信ログを読み込む(プレイヤーID, コールバック) {
      データベース操作.#全取得(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.手紙送信ログ.接尾辞}`, コールバック);
    }

    static 手紙を書き込んでから読み込む(プレイヤーID, 送信先プレイヤー名, チャット, コールバック, プレイヤー非存在時コールバック) {
      データベース操作.プレイヤーを読み込む(送信先プレイヤー名, (データベースイベント) => {
        if (データベースイベント.target.result === undefined) {
          プレイヤー非存在時コールバック();
          return;
        }
        // TODO 連続で手紙を送ることはできません。しばらくしてから送ってください
        const 書き込みチャット = [チャット];
        データベース操作.#ログを追加(`${データベースイベント.target.result._ID}${データベース操作.#保管庫群.プレイヤー.手紙受信ログ.接尾辞}`, 書き込みチャット);
        データベース操作.#ログを追加(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.手紙送信ログ.接尾辞}`, 書き込みチャット, コールバック);
      });
    }

    static 手紙受信ログを読み込む(プレイヤーID, コールバック) {
      データベース操作.#全取得(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.手紙受信ログ.接尾辞}`, コールバック);
    }

    static 言葉を教える(プレイヤーID, 内容) {
      データベース操作.#ログを追加(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.ホームはなす.接尾辞}`, [内容]);
    }

    static 話す言葉を取得(プレイヤーID, コールバック) {
      データベース操作.#全取得(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.ホームはなす.接尾辞}`, コールバック);
    }

    static アイテムを送る(アイテム名, 送信プレイヤーID, 受信プレイヤーID) {
      データベース操作.#倉庫間を移動(アイテム名, データベース操作.#保管庫群.プレイヤー.アイテム倉庫.接尾辞, 送信プレイヤーID, 受信プレイヤーID);
    }

    static アイテムを入手(アイテム名, プレイヤーID) {
      データベース操作.#新規データ追加(`${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.アイテム倉庫.接尾辞}`, アイテム名);
    }

    static アイテムを破棄(アイテム名, プレイヤーID) {
      データベース操作.倉庫内の最初のキーを取得(アイテム名, プレイヤーID, (データベースイベント) => {
        データベースイベント.target.source.objectStore.delete(データベースイベント.target.result);
      });
    }

    static 倉庫内の最初のキーを取得(アイテム名, プレイヤーID, コールバック) {
      const 対象 = `${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.アイテム倉庫.接尾辞}`;
      データベース操作.#データベース.transaction(対象, "readwrite")
        .objectStore(対象)
        .index("名前")
        .getKey(アイテム名)
        .addEventListener("success", コールバック);
    }

    static 倉庫内のアイテムを入れ替える(引き出すアイテム名, 預けるアイテム名, プレイヤーID) {
      const 対象 = `${プレイヤーID}${データベース操作.#保管庫群.プレイヤー.アイテム倉庫.接尾辞}`;
      データベース操作.#データベース.transaction(対象, "readwrite")
        .objectStore(対象)
        .index("名前")
        .put(預けるアイテム名, 引き出すアイテム名);
    }

    static モンスターを送る(アイテム名, 送信プレイヤーID, 受信プレイヤーID) {
      データベース操作.#倉庫間を移動(アイテム名, データベース操作.#保管庫群.プレイヤー.モンスター倉庫.接尾辞, 送信プレイヤーID, 受信プレイヤーID);
    }

    static 画像からモンスター倉庫IDを取得() {

    }

    static プレイヤー軌跡を追加(内容, プレイヤーID) {
      データベース操作.#ログを追加(`${プレイヤーID}${データベース操作.#保管庫名.プレイヤー軌跡.接尾辞}`, 内容);
    }

    static ニュースを追加(内容) {
      データベース操作.#ログを追加(データベース操作.#保管庫名.ニュース, 内容);
    }

    static エラータイプ = Object.freeze({
      既に存在する: "ConstraintError"
    });

    static #データベースをアップグレード(データベースイベント) {
      const データベース = データベースイベント.target.result;
      if (データベースイベント.oldVersion < 1) {
        データベース.createObjectStore(データベース操作.#保管庫名.プレイヤー一覧, { keyPath: "_名前", autoIncrement: true });
        データベース.createObjectStore(データベース操作.#保管庫名.ギルド一覧, { keyPath: "_名前", autoIncrement: true });
        const クエスト一覧 = データベース.createObjectStore(データベース操作.#保管庫名.クエスト一覧, { autoIncrement: true });
        クエスト一覧.createIndex("名前", "名前", { unique: true });
        クエスト一覧.createIndex("最終更新日時", "最終更新日時", { unique: true });
        データベース.createObjectStore(データベース操作.#保管庫名.ニュース, { autoIncrement: true });
        const 依頼一覧 = データベース.createObjectStore(データベース操作.#保管庫名.何でも屋依頼一覧, { keyPath: "_ID" });
        for (let i = 0; i < 何でも屋の依頼数; i += 1) {
          依頼一覧.add(何でも屋の依頼.ダミーデータ取得(i));
        }
        データベース.createObjectStore(データベース操作.#保管庫名.更新連打, { autoIncrement: true });
        for (const 場所名 of 場所.全場所名()) {
          データベース操作.#新規保管庫作成(データベース, データベース操作.#保管庫群.場所, null, 場所名)
        }
      }
      セーブデータ.データベースバージョン.保存(データベース操作.#バージョン);
    }

    static #データベースを登録(データベースイベント) {
      データベース操作.#データベース = データベースイベント.target.result;
    }

    static #倉庫間を移動(名前, 倉庫接尾辞, 送信プレイヤーID, 受信プレイヤーID) {
      const
        送信プレイヤー倉庫 = `${送信プレイヤーID}${倉庫接尾辞}`,
        受信プレイヤー倉庫 = `${受信プレイヤーID}${倉庫接尾辞}`,
        要求 = データベース操作.#データベース.transaction([送信プレイヤー倉庫, 受信プレイヤー倉庫], "readwrite");
      要求.objectStore(送信プレイヤー倉庫)
        .remove(データベース操作.#倉庫IDを取得(名前, 倉庫接尾辞, 送信プレイヤーID, 要求));
      要求.objectStore(受信プレイヤー倉庫)
        .add(アイテム名);
    }

    static #倉庫IDを取得(名前, 倉庫接尾辞, プレイヤーID, 要求 = データベース操作.#データベース.transaction([`${プレイヤーID}${倉庫接尾辞}`], "readonly")) {
      要求.objectStore(プレイヤーID)
        .index("_名前")
        .get(名前);
    }

    static #新規データ群作成(新規保管庫情報リスト, 保管庫名, 内容, 保管庫デフォルトアイテム, IDを保存する = false) {
      データベース操作.#データベース?.close();
      const
        リクエスト = indexedDB.open(データベース操作.#データベース名, ++データベース操作.#バージョン);
      リクエスト.addEventListener("upgradeneeded", () => {
        const ID = データベース操作.#新規保管庫作成(リクエスト.result, 新規保管庫情報リスト, 保管庫デフォルトアイテム);
        if (IDを保存する)
          内容.ID = ID;
      });
      リクエスト.addEventListener("success", () => {
        データベース操作.#新規データ追加(保管庫名, 内容);
      });
    }

    static #新規保管庫作成(データベース, 新規保管庫情報リスト, 保管庫デフォルトアイテム, 名前 = データベース操作.#ID生成()) {
      for (const 新規保管庫情報 of Object.values(新規保管庫情報リスト)) {
        if (typeof 新規保管庫情報.接尾辞 !== "string") {
          throw new Error("接尾辞は文字列にしてください");
        }
        const 新規保管庫 = データベース.createObjectStore(`${名前}${新規保管庫情報.接尾辞}`, { autoIncrement: true }),
          デフォルトアイテム = 保管庫デフォルトアイテム?.get(新規保管庫情報);
        if (デフォルトアイテム)
          新規保管庫.add(デフォルトアイテム);
        if (!新規保管庫情報.索引リスト)
          continue;
        for (const 索引 of 新規保管庫情報.索引リスト)
          新規保管庫.createIndex(索引.名前 ?? "名前", 索引.名前 ?? 空文字列, 索引.固有 ? { unique: true } : null);
      }
      セーブデータ.データベースバージョン.保存(データベース操作.#バージョン);
      データベース操作.#データベース = データベース;
      return 名前;
    }

    static #新規データ追加(保管庫名, 内容) {
      データベース操作.#データベース.transaction(保管庫名, "readwrite")
        .objectStore(保管庫名)
        .add(内容);
    }

    static #データの更新または新規追加(保管庫名, 内容) {
      データベース操作.#データベース.transaction(保管庫名, "readwrite")
        .objectStore(保管庫名)
        .put(内容);
    }

    static #逐次取得と更新(保管庫名, コールバック) {
      データベース操作.#データベース.transaction(保管庫名, "readwrite")
        .objectStore(保管庫名)
        .openCursor()
        .addEventListener("success", コールバック);
    }

    static #全取得(保管庫名, コールバック) {
      データベース操作.#データベース.transaction(保管庫名, "readonly")
        .objectStore(保管庫名)
        .getAll()
        .addEventListener("success", コールバック);
    }

    static #ID生成() {
      return btoa(String.fromCharCode(...データベース操作.#数字をUint8Arrayに(データベース操作.#バージョン - 1)));
    }

    static #数字をUint8Arrayに(数字) {
      if (typeof 数字 !== "number" || 数字 < 0) {
        throw new TypeError("0以上の数字にしてください");
      }
      数字 = Math.floor(数字);
      const 配列 = [];
      let 添え字 = 0;
      while (数字 !== 0) {
        // new Uint8Array 時に自動的に%256されるので問題ない
        配列[添え字++] = 数字;
        数字 >>= 8;
      }
      return new Uint8Array(配列);
    }

    static #ログを追加(保管庫名, 内容リスト, コールバック) {
      const
        保管庫 = データベース操作.#データベース.transaction(保管庫名, "readwrite")
          .objectStore(保管庫名);
      for (const 内容 of 内容リスト) {
        保管庫.add(内容);
      }
      データベース操作.#ログ最大数制限(保管庫, コールバック);
    }

    static #ログ最大数制限(保管庫, コールバック) {
      保管庫.count().addEventListener("success", (イベント) => {
        const
          要求 = イベント.target,
          保管庫 = 要求.source,
          超過ログ件数 = イベント.target.result - 最大ログ保存件数;
        if (超過ログ件数 <= 0) {
          if (コールバック) {
            保管庫.getAll().addEventListener("success", コールバック);
          }
          return;
        }
        保管庫.openKeyCursor().addEventListener("success", (イベント) => {
          保管庫.delete(IDBKeyRange.upperBound(イベント.target.result.key + 超過ログ件数, true));
          if (コールバック) {
            保管庫.getAll().addEventListener("success", コールバック);
          }
        });
      });
    }

    static #データベース;
    static #バージョン;
    static #データベース名 = Object.freeze("＠ぼっちぃー");
    static #保管庫名 = Object.freeze({
      プレイヤー一覧: "プレイヤー一覧",
      ログイン中プレイヤー一覧: "ログイン中プレイヤー一覧",
      ギルド一覧: "ギルド一覧",
      クエスト一覧: "クエスト一覧",
      何でも屋依頼一覧: "依頼一覧",
      ニュース: "ニュース",
      更新連打: "更新連打"
    });
    static #保管庫群 = Object.freeze({
      // 基本的には
      // (一度登録したらなくならないもの || ログ) ? 大文字 : 小文字
      // base64の後に付加するので3文字までなら大丈夫なはず
      // それに気を付ければダブらなければ何でも大丈夫
      プレイヤー: Object.freeze({
        ホーム通知: Object.freeze({
          接尾辞: "a" // Alert
        }),
        錬金レシピ: Object.freeze({
          接尾辞: "A" // Alchemy
        }),
        戦闘報酬: Object.freeze({
          接尾辞: "b" // Battle
        }),
        アイテム倉庫: Object.freeze({
          接尾辞: "i", // Item Depot
          索引リスト: [{ 名前: undefined }]
        }),
        アイテム図鑑: Object.freeze({
          接尾辞: "I", // Item Book
          索引リスト: [{ 名前: "名前", 固有: true }]
        }),
        プロフィール: Object.freeze({
          接尾辞: "j" // Jikoshokai
        }),
        ジョブマス: Object.freeze({
          接尾辞: "J", // Job Master
          索引リスト: [{ 名前: "名前", 固有: true }]
        }),
        入金: Object.freeze({
          接尾辞: "k", // "KANE"
          索引リスト: [{ 名前: "名前", 固有: true }]
        }),
        プレイヤー軌跡: Object.freeze({
          接尾辞: "K" // Kiseki
        }),
        /* 場所.ログ L */
        手紙送信ログ: Object.freeze({
          接尾辞: "S" // Letter Sending Log
        }),
        モンスター倉庫: Object.freeze({
          接尾辞: "m", // Monster Depot
          索引リスト: [{ 名前: "名前" }, { 名前: "画像" }]
        }),
        モンスターブック: Object.freeze({
          接尾辞: "M" // Monster Book
        }),
        /* 場所.キャラクター一覧 p */
        手紙受信ログ: Object.freeze({
          接尾辞: "R" // Letter Receiving Log
        }),
        すくしょ: Object.freeze({
          接尾辞: "s"
        }),
        ホームはなす: Object.freeze({
          接尾辞: "t" // Talk
        })
      }),
      クエスト: Object.freeze({
        /* 場所.ログ L */
        /* 場所.キャラクター一覧 p */
      }),
      ギルド: Object.freeze({
        /* 場所.ログ L */
        /* 場所.キャラクター一覧 p */
      }),
      場所: Object.freeze({
        ログ: Object.freeze({
          接尾辞: "L" // Log
        }),
        キャラクター一覧: Object.freeze({
          接尾辞: "p", // Player
          索引リスト: [{ 名前: "名前", 固有: true }]
        })
      })
    });
  }

  class 場所別キャラクター読み込み君 {
    constructor(場所) {
      this.#場所 = 場所;
      // TODO ＠ほーむのメンバーが存在するかチェック
      データベース操作.場所別キャラクターを更新する(場所.ログ名, this.#キャラクターの削除とあなたの更新または追加.bind(this));
    }

    #キャラクターの削除とあなたの更新または追加(データベースイベント) {
      // keyを使いたいので逐次読み込み
      const カーソル = データベースイベント.target.result;
      if (カーソル?.value) {
        const _キャラクター = キャラクター.オブジェクトから(カーソル.value, カーソル.key);
        if (_キャラクター.場所から削除する()) {
          カーソル.delete();
        }
        else {
          this.#キャラクターリスト.add(_キャラクター);
          if (_キャラクター.はあなた()) {
            this.#あなたの場所別ID = カーソル.key;
            カーソル.update(あなた.キャラクターへ(this.#あなたの場所別ID));
          }
        }
        カーソル.continue();
      }
      else {
        if (this.#あなたの場所別ID === undefined) {
          const あなたのキャラクター = あなた.キャラクターへ(this.#あなたの場所別ID);
          データベースイベント.target.source.add(あなたのキャラクター);
          // 場所移動をした更新時にハリボテを表示する
          this.#キャラクターリスト.add(あなたのキャラクター);
        }
        this.#場所.メイン(this.#キャラクターリスト, this.#あなたの場所別ID);
      }
    }

    #場所;
    #あなたの場所別ID;
    #キャラクターリスト = new Set();
  }

  class 読み込み君 {
    constructor(クラス, コールバック) {
      this.#クラス = クラス;
      this.#コールバック = コールバック;
    }

    _読み込む(データベースイベント) {
      カーソル = データベースイベント.target.result;
      if (カーソル?.value) {
        this._結果リスト.add(this._クラス.オブジェクトから(カーソル.value));
        カーソル.continue();
      }
      else {
        this._コールバック(this._結果リスト);
      }
    }

    get _クラス() { return this.#クラス; }
    get _コールバック() { return this.#コールバック; }
    get _結果リスト() { return this.#結果リスト; }

    #クラス;
    #コールバック;
    #結果リスト = new Set();
  }

  class セーブデータ {
    constructor(名前, 整数か = false, デフォルト値 = undefined) {
      this.#名前 = 名前;
      this.#整数か = 整数か;
      this.#デフォルト値 = デフォルト値;
      this.#取得済みか = false;
      // TODO 一覧()でアクセスするようにする
      Object.defineProperty(セーブデータ, 名前, {
        value: this,
        writable: false
      });
    }

    取得() {
      if (!this.#取得済みか) {
        this.#セーブ先から読み込み();
        this.#取得済みか = true;
      }
      return this.#データ;
    }

    保存(内容) {
      this.#データ = 内容;
      セーブデータ.#セーブ先.setItem(this.#名前, 内容);
    }

    増減(増加量) {
      if (!this.#整数か) {
        throw new TypeError("整数でないセーブデータは増減させられません");
      }
      this.保存(this.取得() + 増加量);
    }

    削除() {
      this.#データ = this.#デフォルト値;
      セーブデータ.#セーブ先.removeItem(this.#名前);
    }

    static 読み込み() {
      new セーブデータ("更新連打回数", true, 0);
      new セーブデータ("データベースバージョン", true, 1);
      new セーブデータ("プレイヤー一覧更新日時", true, -Infinity);
      new セーブデータ("登録者数", true, 0);
    }

    #セーブ先から読み込み() {
      const データ = セーブデータ.#セーブ先.getItem(this.#名前);
      this.#データ = データ ?? this.#データ;
      if (this.#整数か) {
        this.#データ = parseInt(this.#データ);
      }
    }

    #名前;
    #データ;
    #デフォルト値;
    #取得済みか;
    #整数か;

    static #セーブ先 = localStorage;
  }

  class エラー {
    static 表示(内容) {
      エラー.#エラー内容.textContent = 内容;
      画面.一覧("エラー画面").表示();
      親ページ.トップ表示();
      $id("エラー-トップへ").addEventListener("click", エラー.#トップへ);
    }

    static #トップへ() {
      画面.一覧("トップ画面").表示();
    }

    static ページが見つかりませんでした() {
      エラー.表示("ページが見つかりませんでした");
    }

    static プレイヤーが存在しません(名前) {
      エラー.表示(`そのような名前${名前}のプレイヤーが存在しません`);
    }

    static #エラー内容 = $id("エラー内容");
  }


  class キャラクター {
    constructor(名前, アイコン, 色 = NPC色, 最終更新日時, 場所別ID) {
      this._名前 = 名前;
      this._アイコン = アイコン;
      this._色 = 色;
      this._最終更新日時 = 最終更新日時;
      this._場所別ID = 場所別ID;
    }

    get 名前() { return this._名前 }
    get 場所別ID() { return this._場所別ID; }
    get 最終更新日時() { return this._最終更新日時; }

    _名前;
    _色;
    _アイコン;
    _最終更新日時;
    _場所別ID;

    チャット(内容, 宛て先) {
      return new チャット(this._名前, this._色, 内容, 更新日時.取得(), 宛て先);
    }

    場所用出力() {
      return キャラクター.場所用出力(this);
    }

    場所から削除する() {
      return this._最終更新日時 + メンバー表示秒数 < 更新日時.取得();
    }

    はあなた() {
      return this._名前 === あなた.名前;
    }

    はNPC色() {
      return this._色 === NPC色;
    }

    色を変更(色コード) {
      if (typeof 色コード !== "string") {
        return undefined;
      }
      const _色コード = 色コード.match(有効なカラーコードか)[0];
      if (_色コード === undefined) {
        return undefined;
      }
      this._色 = _色コード;
      return _色コード;
    }

    static 場所用出力(キャラクター) {
      const
        全体枠 = document.createElement("div"),
        名前 = document.createElement("div"),
        画像 = document.createElement("img");
      全体枠.classList.add("メンバー");
      名前.style.color = キャラクター._色;
      名前.classList.add("メンバー名");
      名前.textContent = キャラクター._名前;
      全体枠.appendChild(名前);
      画像.src = `resource/icon/${キャラクター._アイコン}`;
      画像.alt = キャラクター._名前;
      全体枠.appendChild(画像);
      チャットフォーム.文字列追加イベントを登録(全体枠, `>${キャラクター._名前} `);
      return 全体枠;
    }

    static オブジェクトから({ _名前, _アイコン, _色, _最終更新日時 }, 場所別ID) {
      return new キャラクター(_名前, _アイコン, _色, _最終更新日時, 場所別ID);
    }
  }

  class ログインメンバー extends キャラクター {
    constructor(情報) {
      super(情報._名前, 情報._色, 情報._アイコン, 情報._最終更新日時);
      this._めっせーじ = 情報._めっせーじ;
      this._ギルド名 = 情報._ギルド名;
    }

    _ギルド名;
    _めっせーじ;

    出力(ギルドを出力する = true, めっせーじを出力する = false, 無色 = false) {
      return `<span${無色 ? 空文字列 : ` style="color: ${this._色}"`}><img src="${this._アイコン}" />${this._名前}${ギルドを出力する && this._ギルド名 ? `＠${this._ギルド名}` : 空文字列}${めっせーじを出力する ? `＠${this._めっせーじ}` : 空文字列}</span>`;
    }
  }

  class メンバー extends ログインメンバー {
    constructor(情報) {
      super(情報);
      for (const [状態名, 状態] of Object.entries(情報)) {
        switch (状態名) {
          case "_ステータス":
            this[状態名] = ステータス.オブジェクトから(状態);
            break;
          case "_所持金":
          case "_カジノコイン":
          case "_福引券":
          case "_小さなメダル":
          case "_レアポイント":
            this[状態名] = 通貨.オブジェクトから(状態);
            break;
          case "_現職":
          case "_前職":
            this[状態名] = 状態 ? メンバーの職業.オブジェクトから(状態) : undefined;
            break;
          case "_現在地名":
            if (状態 === "家") {
              家.一覧(情報._家のユーザー名, this.#現在地を設定.bind(this), 情報._名前, 情報._ID);
            }
            else {
              this.#現在地を設定(場所.一覧(状態));
            }
            break;
          case "_実績":
            this[状態名] = new 実績(状態);
            break;
          default:
            this[状態名] = 状態;
            break;
        }
      }
      this._実績 ??= new 実績();
    }

    転職(次職) {
      this.ギルド?.ポイント増加(50);
      this.軌跡に書き込み(`${this.現職.名前}から${次職.名前}に転職`);
      // TODO 全体の傾向に追加
      // TODO ジョブマス確認
      const 消費アイテム名 = 次職.転職条件.消費アイテム名を取得(this);
      if (消費アイテム名 !== undefined) {
        this.装備アイテムを売る(消費アイテム名, 0);
      }
      this._転職回数 += 1;
      this._レベル = 1;
      this._経験値 = 0;
      this.ステータス.半減();
      if (次職.名前 === this.現職.名前) {
        this.アイコンをリセット();
        return 消費アイテム名;
      }
      this._前職 = this.現職;
      if (次職.名前 === this.前職.名前) {

      }
      this._現職 = 次職;
      this.アイコンをリセット();
      return 消費アイテム名;
    }

    可能ならレベルアップ() {
      if (this._レベル * this._レベル * 10 > this._経験値)
        return false;
      this.現職.レベルアップ(this.ステータス);
      return true;
    }

    一気にレベルアップ() {
      while (可能ならレベルアップ());
    }

    現職SP増加(増加量) {
      const 増加前現職SP = this._現SP;
      this._現SP += 増加量;
      // TODO: スキル習得ログ
    }

    async アイテムを使う(アイテム名) {
      const _アイテム = アイテム.一覧(アイテム名);
      if (アイテム名 === undefined || _アイテム === undefined || !await this.倉庫に存在する(アイテム名)) {
        return false;
      }
      if (_アイテム.使う()) {
        if (アイテム === this.道具.名前) {
          this.道具 = undefined;
        }
        this.倉庫から取り除く(アイテム);
      }
    }

    軌跡に書き込み(内容) {
      データベース操作.プレイヤー軌跡を追加([内容], this._ID);
    }

    プロフィールを更新(保存データ) {
      console.log(this._ID);
      データベース操作.プロフィールを更新(this._ID, 保存データ);
    }

    睡眠(時間, 上書きする = true) {
      this._起床時刻 = 時間 + ((上書きする || this.睡眠時間取得() === 0) ? 更新日時.取得() : this._起床時刻);
    }

    は睡眠中() {
      return this._起床時刻 !== undefined;
    }

    予定時刻を過ぎているなら起床する() {
      if (this._起床時刻 >= 更新日時.取得()) {
        return false;
      }
      this._起床時刻 = undefined;
      this._疲労 = 0;
      this.ステータス.ＨＰ.基礎値へ();
      this.ステータス.ＭＰ.基礎値へ();
      this._飲食済み = false;
      this.アイコンをリセット();
      return true;
    }

    睡眠時間取得() {
      return Math.max(this._起床時刻 - 更新日時.取得(), 0);
    }

    更新連打確認() {
      // TODO
      const 更新連打回数 = parseInt(ローカルセーブデータ.getItem("更新連打回数"));
      if (!更新連打回数) {
        return;
      }
      for (const [回数, 睡眠秒数] of 更新連打の睡眠秒数) {
        if (回数 > 更新連打回数)
          continue;
        this.睡眠(睡眠秒数, false);
        ローカルセーブデータ.setItem("更新連打回数", 0);
        データベース操作.プレイヤーを保存(this);
        エラー.表示(`<span class="die">前回のプレイ時に更新連打が${回数}回を超えていたので、${Math.round(睡眠秒数 / 60)}分間睡眠状態となります</span>`);
        return true;
      }
      ローカルセーブデータ.setItem("更新連打回数", 0);
      return false;
    }

    更新連打追加() {
      ローカルセーブデータ.setItem("更新連打回数", parseInt(ローカルセーブデータ.getItem("更新連打回数") + 1));
    }

    データベースに保存() {
      データベース操作.プレイヤーを保存(this);
    }

    データベースに錬金レシピを保存(錬金レシピ) {
      データベース操作.習得錬金レシピを保存(錬金レシピ, this._ID);
    }

    コンプリート(種別) {
      // TODO 職業・モンスター・錬金ならフラグ立て
      // TODO コレクションはテクニカルな感じで重複処理回避してるので要検討
      伝説のプレイヤー.登録(new ログインメンバー(this));
      プレイヤーの軌跡.書き込む(クラス付きテキスト("comp", `${種別} Complete!!`));
      ニュース.書き込む(クラス付きテキスト("comp", `${種別} ${あなた}が${種別}をコンプリートする！`));
    }

    バックアップ() {

    }

    家を取得() {
      return new 家(this.名前, this._ID);
    }

    場所移動(行き先) {
      this.#現在地のキャラクターから消去();
      if (行き先 instanceof 家) {
        this._家のユーザー名 = 行き先.所有者;
      }
      this.#現在地を設定(行き先);
    }

    async ログイン(パスワード, めっせーじ) {
      if (this.#パスワード確認(パスワード) || this.更新連打確認()) {
        return;
      }
      this._めっせーじ = めっせーじ;
      this._最終更新日時 = 更新日時.取得();
      //TODO this.トップに登録();
      ギルド.必要なら一覧出力();
      データベース操作.プレイヤーを保存(this);
      await メンバー.#必要ならプレイヤー削除と一覧更新();
    }

    ログアウト() {
      this.#現在地のキャラクターから消去();
      this.データベースに保存();
      throw "ログアウト";
    }

    削除(保存する = true) {
      this._ギルド.メンバー削除(this);
      メンバー.#一覧.remove(this);
      if (保存する)
        メンバー.保存();
    }

    現職名または前職名(職業名) {
      return this.現職.名前 === 職業名 || this.前職?.名前 === 職業名;
    }

    アイコンをリセット() {
      this._アイコン = this.現職.アイコン名を取得(this._性別);
    }

    装備(アイテム, アイテム図鑑に登録する = true) {
      let 交換アイテム名;
      if (アイテム instanceof 武器) {
        交換アイテム名 = this._武器;
        this._武器 = アイテム.名前;
      }
      else if (アイテム instanceof 防具) {
        交換アイテム名 = this._防具;
        this._防具 = アイテム.名前;
      }
      else if (アイテム instanceof 道具) {
        交換アイテム名 = this._道具;
        this._道具 = アイテム.名前;
      }
      else {
        throw new TypeError(`${アイテム名.名前}は装備できないアイテムです`);
      }
      if (アイテム図鑑に登録する) {
        // TODO
      }
      if (交換アイテム名 !== undefined) {
        // デフォルトに忠実
        データベース操作.倉庫内のアイテムを入れ替える(this._武器, 交換アイテム名, this._ID);
        return true;
      }
      return false;
    }

    アイテムに対応する装備スロットが空いている(アイテム) {
      if (アイテム instanceof 武器) {
        return this._武器 === undefined;
      }
      else if (アイテム instanceof 防具) {
        return this._防具 === undefined;
      }
      else if (アイテム instanceof 道具) {
        return this._道具 === undefined;
      }
      else {
        throw new TypeError(`${アイテム名}は装備できないアイテムです`);
      }
    }

    装備または倉庫に送る(アイテム名, アイテム図鑑に登録する = true) {
      this.倉庫にアイテムを送る(アイテム名, this._ID);
      const _アイテム = アイテム.一覧(アイテム名);
      if (!this.アイテムに対応する装備スロットが空いている(_アイテム)) {
        return false;
      }
      this.装備(_アイテム, アイテム図鑑に登録する);
      return true;
    }

    装備アイテムを売る(アイテム名, 価格) {
      if (this._武器 === アイテム名) {
        this._武器 = undefined;
      }
      else if (this._防具 === アイテム名) {
        this._防具 = undefined;
      }
      else if (this._道具 === アイテム名) {
        this._道具 = undefined;
      }
      else {
        throw new Error("装備中ではないアイテムは売れません");
      }
      this.所持金.収支(価格);
      データベース操作.アイテムを破棄(アイテム名, this._ID);
    }

    倉庫にアイテムを送る(アイテム名) {
      データベース操作.アイテムを入手(アイテム名, this._ID);
      // TODO 倉庫一杯かチェック
    }

    倉庫から取り除く(アイテム名) {
      データベース操作.アイテムを破棄(アイテム名, this._ID);
      // TODO 倉庫一杯かチェック
    }

    依頼を完了する(報酬名, ギルドポイント) {
      this.倉庫にアイテムを送る(報酬名);
      if (ギルドポイント) {
        this._ギルド?.ポイント増加(ギルドポイント);
      }
      this._実績.依頼ポイント増加();
    }

    錬金を始める(レシピ) {
      this._錬金中レシピ = レシピ;
    }

    錬金を完成させる() {
      if (this._錬金中レシピ === undefined) {
        return;
      }
      this._錬金完成済み = true;
    }

    錬金を受け取る() {
      if (!this._錬金完成済み) {
        return undefined;
      }
      const レシピ = this._錬金中レシピ;
      this.倉庫にアイテムを送る(レシピ.完成品名);
      this._実績.錬金ポイント増加();
      レシピ.作成済み = true;
      this.錬金レシピを登録(レシピ);
      this._錬金中レシピ = undefined;
      this._錬金完成済み = false;
      return レシピ;
    }

    ヘッダー用出力() {
      // TODO ステータスは武器防具込みのもの、素早さのみ max(0,素早さ)
      const 断片 = 強調テキスト(
        "ゴールド ", this.所持金.所持,
        "G / 攻撃力 ", this._ステータス.攻撃力,
        " / 守備力 ", this._ステータス.守備力,
        " / 素早さ ", this._ステータス.素早さ,
        " /",
      );
      断片.appendChild(this.ヘッダー用装備出力());
      return 断片;
    }

    ヘッダー用装備出力() {
      const 断片 = document.createDocumentFragment();
      if (this._武器) {
        断片.appendChild(document.createTextNode(` E：${this._武器}`));
      }
      if (this._防具) {
        断片.appendChild(document.createTextNode(` E：${this._防具}`));
      }
      if (this._道具) {
        断片.appendChild(document.createTextNode(` E：${this._道具}`));
      }
      return 断片;
    }

    こうどう用装備出力(こうどう名) {
      const 断片 = document.createDocumentFragment();
      if (this._武器) {
        断片.appendChild(アイテム.一覧(this._武器).こうどう用出力(こうどう名));
      }
      if (this._防具) {
        断片.appendChild(アイテム.一覧(this._防具).こうどう用出力(こうどう名));
      }
      if (this._道具) {
        断片.appendChild(アイテム.一覧(this._道具).こうどう用出力(こうどう名));
      }
      return 断片;
    }

    が装備中(アイテム名) {
      return アイテム名 === this._武器 || アイテム名 === this._防具 || アイテム名 === this._道具;
    }

    疲労確認() {
      if (this._疲労 >= 疲労限界) {
        通知欄.追加("疲労がたまっています。「＠ほーむ」で家に帰り「＠ねる」で休んでください", "＠ほーむ");
        return true;
      }
      return false;
    }

    set ID(_ID) { this._ID = _ID; }
    set _現在地(_現在地名) { console.error("代わりに メンバー.prototype.場所移動(場所名) を使え"); }

    get 残り睡眠秒数() { return this._起床時刻 - 更新日時.取得(); }
    get _現在地() { return this.#現在地; }
    get 転職回数() { return this._転職回数; }
    get 現職() { return this._現職; }
    get 前職() { return this._前職; }
    get 所持金() { return this._所持金; }
    get カジノコイン() { return this._カジノコイン; }
    get 実績() { return this._実績; }
    get ステータス() { return this._ステータス; }
    get レベル() { return this._レベル; }

    static 新規登録(_名前, _パスワード, _職業名, _性別) {
      // TODO ブラックリスト
      // throw new Error("あなたのホストからは登録することが禁止されています");
      if (メンバー.#登録チェック(_名前, _パスワード, _職業名, _性別))
        return;
      // TODO 多重登録禁止
      // throw new Error("多重登録は禁止しています");
      const
        _ステータス = {
          ＨＰ: 整数乱数(32, 30, true),
          ＭＰ: 整数乱数(8, 6, true),
          攻撃力: 整数乱数(8, 6, true),
          守備力: 整数乱数(8, 6, true),
          素早さ: 整数乱数(8, 6, true)
        },
        _メンバー = new メンバー({
          _名前,
          _パスワード,
          _現職: {
            _職業名,
            _SP: 0
          },
          _所持金: {
            _所持: 200
          },
          _色: "#FFFFFF",
          _性別,
          _現在地名: "何でも屋",
          _転職回数: 0,
          _レベル: 1,
          _アイコン: 転職可能な職業.一覧(_職業名).アイコン名を取得(_性別),
          _ステータス
        });
      セーブデータ.登録者数.増減(1);
      ニュース.書き込み(`<span class="強調">${_名前}</span> という冒険者が参加しました`);
      画面.一覧("トップ画面").新規登録完了表示(_名前, _パスワード, _職業名, _性別, _ステータス);
      //TODO 紹介ID付きなら紹介者に小さなメダル送信
      // データベース操作.アイテム入手("小さなメダル", ID, "$m{name}(紹介加入)");
      データベース操作.新規プレイヤー登録(_メンバー, `冒険者 <span class="強調">${_名前}</span> 誕生！`);
      return _メンバー;
    }

    static データベースから読み込む(名前, コールバック) {
      データベース操作.プレイヤーを読み込む(名前, コールバック);
    }

    _ID;
    _ギルド;
    _性別;
    _最終ログイン日時;
    _現在地名;
    _家のユーザー名;
    _壁紙;
    #現在地;
    _ステータス;
    _レベル;
    _経験値;
    _現職;
    _前職;
    _転職回数;
    _所持金;
    _カジノコイン;
    _小さなメダル;
    _福引券;
    _レアポイント;
    _疲労;
    _オーブフラグ;
    _預かり所が空き;
    _宝を取得済み;
    _飲食済み;
    _錬金完成済み;
    _錬金中レシピ;
    _実績;
    _ダンジョンイベント;
    _錬金レシピ;
    _起床時刻;

    #プレイヤー一覧用出力() {
      const
        tr = document.createElement("tr"),
        項目名リスト = new Set("_性別", "_ギルド", "_レベル", "_転職回数", "_現職", "_前職", "_ステータス", "_所持金", "_カジノコイン", "_小さなメダル", "_武器", "_防具", "_道具", "_実績"),
        数値 = new Set("_レベル", "_転職回数", "_ステータス", "_実績");
      const td = document.createElement("td");
      td.innerHTML = `<a href="../player.cgi?id=$dir_name">${this._名前}</a><img src="../$icondir/${this._アイコン}" />`;
      tr.appendChild(td);
      for (const 項目名 of 項目名リスト) {
        if (this[項目名].プレイヤー一覧用出力) {
          const fragment = document.createDocumentFragment();
          for (const 出力 of this[項目名].プレイヤー一覧用出力()) {
            const td = document.createElement("td");
            td.textContent = 出力;
            if (数値.has(項目名))
              td.classList.add("数値");
            fragment.appendChild(td);
          }
          tr.appendChild(fragment);
        }
        else {
          const td = document.createElement("td");
          td.textContent = this[項目名];
          if (数値.has(項目名))
            td.classList.add("数値");
        }
        tr.appendChild(td);
      }
      const td2 = document.createElement("td");
      td2.textContent = this._最終ログイン日時;
      tr.appendChild(td2);
      return tr;
    }

    #現在地を設定(場所) {
      this.#現在地 = 場所 ?? 場所.一覧("交流広場");
      this._現在地名 = this.#現在地.名前;
    }

    #現在地のキャラクターから消去() {
      // 放置で自動消去されたなら何もしない
      if (this._場所別ID === undefined) {
        return;
      }
      データベース操作.場所別キャラクター一覧から削除(this.#現在地.ログ名, [this._場所別ID]);
      this._場所別ID = undefined;
    }

    #自動削除対象なら削除() {
      if (this._最終ログイン日時
        + ((this.転職回数 === 0 && this.レベル < 2) ? 新規プレイヤー自動削除日数 : プレイヤー自動削除日数) * 60 * 60 * 24
        >= 更新日時.取得()) {
        return false;
      }
      this.削除();
      return true;
    }

    static #必要ならプレイヤー削除と一覧更新() {
      const 現在日時 = 更新日時.取得();
      if (セーブデータ.プレイヤー一覧更新日時.取得() + プレイヤー一覧の更新周期日数 * 60 * 60 * 24 > 現在日時)
        return;
      const tBody = document.createElement("tbody");
      実績.ランキング作成開始();
      /* TODO cursor化
      for (const _メンバー of メンバー.#一覧) {
        //_メンバー.データ破損チェック(バックアップがあれば復旧); 破損していなければバックアップへ;
        if (_メンバー.#自動削除対象なら削除()) {
          continue;
        }
        実績.ランキング判定1(_メンバー);
        tBody.appendChild(_メンバー.#プレイヤー一覧用出力());
      }
      実績.ランキング作成開始2();
      for (const _メンバー of メンバー.#一覧) {
        実績.ランキング判定2(_メンバー);
      }
      //*/
      実績.ランキング出力();
      $id("プレイヤー一覧").appendChild(tBody);
      セーブデータ.プレイヤー一覧更新日時.保存(現在日時);
    }

    static #登録チェック(名前, パスワード, 職業名, 性別) {
      try {
        if (!名前)
          throw "プレイヤー名が入力されていません";
        if (パスワード === 空文字列)
          throw "パスワードが入力されていません";
        if (性別 === 空文字列)
          throw "性別が入力されていません";

        if (メンバー.#プレイヤー名に不正な文字が含まれているか.test(名前))
          throw "プレイヤー名に不正な文字( ,;\"'&<>@ )が含まれています";
        if (メンバー.#プレイヤー名にアットマークが含まれているか.test(名前))
          throw "プレイヤー名に不正な文字( ＠ )が含まれています";
        if (メンバー.#プレイヤー名に不正な空白が含まれているか.test(名前))
          throw "プレイヤー名に不正な空白が含まれています";
        if (全角を2とした文字列長(名前) > 8)
          throw "プレイヤー名は全角４(半角８)文字以内です";

        if (メンバー.#パスワードに半角英数字以外の文字が含まれているか.test(パスワード))
          throw "パスワードは半角英数字で入力して下さい";
        const パスワード長 = パスワード.length;
        if (パスワード長 < 4 || パスワード長 > 12)
          throw "パスワードは半角英数字４～12文字です";
        if (名前 === パスワード)
          throw "プレイヤー名とパスワードが同一文字列です";
        if (性別 !== "男" && 性別 !== "女")
          throw "性別が異常です";

        if (!初期職業.has(職業名))
          throw "職業が異常です";


        if (1 === 0) // TODO
          throw "その名前はすでに登録されています";
        if (セーブデータ.登録者数.取得() >= 最大登録人数)
          throw "現在定員のため、新規登録は受け付けておりません";
        const 最終ipアドレス = 1;
        const 現在ipアドレス = 2;
        if (最終ipアドレス === 現在ipアドレス) // TODO
          throw "多重登録は禁止しています";
      }
      catch (エラー内容) {
        エラー.表示(エラー内容);
        return true;
      }
      return false;
    }

    #パスワード確認(パスワード) {
      if (this._パスワード !== パスワード) {
        エラー.表示("パスワードが違います");
        return true;
      }
      return false;
    }

    static #一覧;
    static #プレイヤー名に不正な文字が含まれているか = Object.freeze(new RegExp(/[,;\"\'&<>\@]/));
    static #プレイヤー名にアットマークが含まれているか = Object.freeze(new RegExp(/＠/));
    static #プレイヤー名に不正な空白が含まれているか = Object.freeze(new RegExp(/＠/));
    static #パスワードに半角英数字以外の文字が含まれているか = Object.freeze(new RegExp(/[^0-9a-zA-Z]/));
  }

  // クソクラス
  class あなた {
    static toString() {
      return あなた.名前;
    }

    static ログイン要求(名前, パスワード, めっせーじ) {
      if (メンテナンスチェック()) {
        return;
      }
      更新日時.更新();
      あなた.#名前 = 名前;
      あなた.#パスワード = パスワード;
      あなた.#めっせーじ = めっせーじ;
      メンバー.データベースから読み込む(名前, あなた.#ログイン時処理);
    }

    static チャット書き込み予約(内容, 宛て先) {
      if (!内容)
        return;
      if (あなた.#予約チャット === undefined) {
        あなた.#予約チャット = あなた.メンバー.チャット(内容, 宛て先);
        あなた.#予約チャット.内容追加(" ");
      }
      else {
        あなた.#予約チャット.内容追加(内容, 宛て先);
      }
    }

    static 場所移動(場所) {
      あなた.チャット書き込み停止();
      あなた.メンバー.場所移動(場所);
      場所.更新要求();
    }

    static プレイヤーの家に移動(メンバー = あなた.メンバー) {
      // TODO メンバーが存在するかチェック
      あなた.メンバー._家のユーザー名 = メンバー.名前;
      あなた.メンバー._家のユーザーID = メンバー._ID;
      家.一覧(メンバー.名前, あなた.場所移動);
    }

    static 受け取った手紙を見る() {
      通知欄.追加(`${あなた}の受け取った手紙`);
      データベース操作.手紙受信ログを読み込む(あなた.メンバー._ID, あなた.現在地.ログ読み込み後の処理.bind(あなた.現在地));
      あなた.#予約チャット = undefined;
      throw "手紙閲覧";
    }

    static 手紙を送る(対象のプレイヤー名) {
      if (!対象のプレイヤー名) {
        あなた.#手紙送信手順の説明を表示();
        データベース操作.手紙送信ログを読み込む(あなた.メンバー._ID, あなた.現在地.ログ読み込み後の処理.bind(あなた.現在地));
      }
      else {
        データベース操作.手紙を書き込んでから読み込む(
          あなた.メンバー._ID,
          対象のプレイヤー名,
          あなた.#予約チャット,
          あなた.現在地.ログ読み込み後の処理.bind(あなた.現在地),
          () => { 通知欄.追加(`${対象のプレイヤー名}というプレイヤーが存在しません`); }
        );
      }
      あなた.#予約チャット = undefined;
      throw "手紙閲覧";
    }

    static #手紙送信手順の説明を表示() {
      const
        断片 = document.createDocumentFragment(),
        span = document.createElement("span");
      チャットフォーム.文字列追加イベントを登録(span, "＠てがみをかく")
      span.textContent = "『△△△＠てがみをかく>○○○』△△△に送りたい文を○○○に送り先の名前を書いてください。";
      断片.append(
        span,
        document.createElement("br"),
        document.createTextNode("↓送信済みの手紙")
      );
      通知欄.追加(断片);
    }

    static 予約チャットを書き込んでから読み込む() {
      あなた.現在地.チャットを書き込んでから読み込む(あなた.#チャット書き込み停止中 ? undefined : あなた.#予約チャット);
      あなた.#チャット書き込み停止中 &&= false;
      あなた.#予約チャット = undefined;
    }

    static チャット書き込み停止(停止する = true) {
      あなた.#チャット書き込み停止中 = 停止する ? true : false;
    }

    static ろぐあうと() {
      あなた.チャット書き込み停止();
      画面.一覧("トップ画面").表示();
      あなた.メンバー.ログアウト();
    }

    static キャラクターへ(場所別ID) {
      あなた.メンバー._場所別ID = 場所別ID;
      return キャラクター.オブジェクトから(あなた.メンバー, 場所別ID);
    }

    static get メンバー() { return あなた.#メンバー; }
    static get 現在地() { return あなた.メンバー._現在地; }
    static get 名前() { return あなた.#名前; }

    static async #ログイン時処理(データベースイベント) {
      const _メンバー = データベースイベント.target.result;
      if (_メンバー === undefined) {
        エラー.プレイヤーが存在しません(あなた.名前);
        return;
      }
      const _あなた = new メンバー(_メンバー);
      あなた.#メンバー = _あなた;
      await _あなた.ログイン(あなた.#パスワード, あなた.#めっせーじ);
      _あなた._現在地.更新要求();
    }

    static #メンバー;
    static #名前;
    static #パスワード;
    static #めっせーじ;
    static #チャット書き込み停止中;
    static #予約チャット;
  }

  class 簡易ステータス {
    constructor(ＨＰ = 0, ＭＰ = 0, 攻撃力 = 0, 守備力 = 0, 素早さ = 0) {
      this.#ＨＰ = ＨＰ;
      this.#ＭＰ = ＭＰ;
      this.#攻撃力 = 攻撃力;
      this.#守備力 = 守備力;
      this.#素早さ = 素早さ;
    }

    get ＨＰ() { return this.#ＨＰ }
    get ＭＰ() { return this.#ＭＰ }
    get 攻撃力() { return this.#攻撃力 }
    get 守備力() { return this.#守備力 }
    get 素早さ() { return this.#素早さ }

    static ＨＰ(ＨＰ) {
      return new 簡易ステータス(ＨＰ, 0, 0, 0, 0);
    }

    static ＭＰ(ＭＰ) {
      return new 簡易ステータス(0, ＭＰ, 0, 0, 0);
    }

    static 攻撃力(攻撃力) {
      return new 簡易ステータス(0, 0, 攻撃力, 0, 0);
    }

    static 守備力(守備力) {
      return new 簡易ステータス(0, 0, 0, 守備力, 0);
    }

    static 素早さ(素早さ) {
      return new 簡易ステータス(0, 0, 0, 0, 素早さ);
    }

    static get ゼロ() {
      return this.#ゼロ;
    }

    static #ゼロ = new 簡易ステータス(0, 0, 0, 0, 0);
    #ＨＰ;
    #ＭＰ;
    #攻撃力;
    #守備力;
    #素早さ;
  }

  class ステータス {
    constructor(ＨＰ = 0, ＭＰ = 0, 攻撃力 = 0, 守備力 = 0, 素早さ = 0, 現在ＨＰ = ＨＰ, 現在ＭＰ = ＭＰ, 現在攻撃力 = 攻撃力, 現在守備力 = 守備力, 現在素早さ = 素早さ) {
      this._ＨＰ = new 個別ステータス(ステータスの種類.消費系, ＨＰ, 現在ＨＰ);
      this._ＭＰ = new 個別ステータス(ステータスの種類.消費系, ＭＰ, 現在ＭＰ);
      this._攻撃力 = new 個別ステータス(ステータスの種類.能力系, 攻撃力, 現在攻撃力);
      this._守備力 = new 個別ステータス(ステータスの種類.能力系, 守備力, 現在守備力);
      this._素早さ = new 個別ステータス(ステータスの種類.能力系, 素早さ, 現在素早さ);
    }

    プレイヤー一覧用出力() {
      return [this.ＨＰ.基礎値, this.ＭＰ.基礎値, this.攻撃力.基礎値, this.守備力.基礎値, this.素早さ.基礎値];
    }

    ヘッダー用基礎値出力() {
      return 強調テキスト(
        " / ＨＰ ", this.ＨＰ.基礎値,
        " / ＭＰ ", this.ＭＰ.基礎値,
        " / 攻撃力 ", this.攻撃力.基礎値,
        " / 守備力 ", this.守備力.基礎値,
        " / 素早さ ", this.素早さ.基礎値
      );
    }

    ヘッダー用出力() {
      return 強調テキスト(
        "ＨＰ", this.ＨＰ.現在値, "/", this.ＨＰ.基礎値,
        " ＭＰ", this.ＭＰ.現在値, "/", this.ＭＰ.基礎値,
        " 攻撃力", this.攻撃力.現在値,
        " 守備力", this.守備力.現在値,
        " 素早さ", this.素早さ.現在値,
      );
    }

    一行出力() {
      return ` ＨＰ:${this.ＨＰ.現在値}/${this.ＨＰ.基礎値}, ＭＰ:${this.ＭＰ.現在値}/${this.ＭＰ.基礎値}, 攻撃力:${this.攻撃力.基礎値}, 守備力:${this.守備力.基礎値}, 素早さ:${this.素早さ.基礎値}`;
    }

    再計算(武器, 防具, 道具) {
      if (武器 !== undefined) {
        this.増加(武器.ステータスへ(), false);
      }
      if (防具 !== undefined) {
        this.増加(防具.ステータスへ(), false);
      }
      if (道具 instanceof 装備系道具) {
        this.増加(道具.ステータスへ(), false);
      }
      const 素早さ = this.素早さ;
      if (素早さ.現在値 < 0) {
        素早さ.現在値 = 0;
      }
    }

    増加(簡易ステータス, カンストチェックする = true) {
      const 上限 = カンストチェックする ? undefined : Infinity
      this.ＨＰ.現在値を設定(簡易ステータス.ＨＰ, 上限);
      this.ＭＰ.現在値を設定(簡易ステータス.ＭＰ, 上限);
      this.攻撃力.現在値を設定(簡易ステータス.攻撃力, 上限);
      this.守備力.現在値を設定(簡易ステータス.守備力, 上限);
      this.素早さ.現在値を設定(簡易ステータス.素早さ, 上限);
    }

    半減() {
      this.ＨＰ.基礎値 = Math.max(this.ＨＰ.基礎値 / 2, 転職時の最低ステータス.ＨＰ);
      this.ＭＰ.基礎値 = Math.max(this.ＭＰ.基礎値 / 2, 転職時の最低ステータス.ＭＰ);
      this.攻撃力.基礎値 = Math.max(this.攻撃力.基礎値 / 2, 転職時の最低ステータス.攻撃力);
      this.守備力.基礎値 = Math.max(this.守備力.基礎値 / 2, 転職時の最低ステータス.守備力);
      this.素早さ.基礎値 = Math.max(this.素早さ.基礎値 / 2, 転職時の最低ステータス.素早さ);
    }

    get ＨＰ() { return this._ＨＰ }
    get ＭＰ() { return this._ＭＰ }
    get 攻撃力() { return this._攻撃力 }
    get 守備力() { return this._守備力 }
    get 素早さ() { return this._素早さ }

    static オブジェクトから(オブジェクト) {
      return new ステータス(オブジェクト?.ＨＰ, オブジェクト?.ＭＰ, オブジェクト?.攻撃力, オブジェクト?.守備力, オブジェクト?.素早さ);
    }

    static ＨＰ() { return "ＨＰ"; }
    static ＭＰ() { return "ＭＰ"; }
    static 攻撃力() { return "攻撃力"; }
    static 守備力() { return "守備力"; }
    static 素早さ() { return "素早さ"; }
  }


  class 個別ステータス {
    constructor(ステータスの種類, 基礎値, 現在値) {
      this.#ステータスの種類 = ステータスの種類;
      this._基礎値 = 基礎値;
      this._現在値 = 現在値;
    }

    基礎値を設定(基礎値, 上限値 = this.#ステータスの種類.上限) {
      this._基礎値 = Math.min(Math.trunc(基礎値), 上限値);
    }

    現在値を設定(現在値, 上限値 = this._値 * this.#ステータスの種類.現在値上限係数) {
      this._現在値 = Math.min(Math.trunc(現在値), 上限値);
    }

    基礎値へ(割合 = 1) {
      this._現在値 = Math.trunc(this._基礎値 * 割合);
    }

    get 基礎値() { return this._基礎値; }
    set 基礎値(_基礎値) { this.基礎値を設定(_基礎値); }
    get 現在値() { return this._現在値; }
    set 現在値(_現在値) { this.現在値を設定(_現在値); }

    _基礎値;
    _現在値;
    #ステータスの種類;
  }

  class ステータスの種類 {
    constructor(上限, 現在値下限係数, 現在値上限係数) {
      this.#上限 = 上限;
      this.#現在値下限係数 = 現在値下限係数;
      this.#現在値上限係数 = 現在値上限係数;
    }

    get 上限() { return this.#上限; }
    get 現在値下限係数() { return this.#現在値下限係数; }
    get 現在値上限係数() { return this.#現在値上限係数; }

    static 消費系 = new ステータスの種類(999, 0.2, 1);
    static 能力系 = new ステータスの種類(255, 0.2, 2.5);
    static 命中率 = new ステータスの種類(95, 50 / 95, 1);

    #上限;
    #現在値下限係数;
    #現在値上限係数;
  }

  class 通貨 {
    constructor(所持, 単位) {
      this.#単位 = 単位;
      this._所持 = 所持;
    }

    収支(_金額, 強制 = false) {
      const 金額 = parseInt(_金額);
      if (Number.isNaN(金額)) {
        throw new TypeError(`${_金額}が数値に変換できませんでした`);
      }
      if (金額 < 0 && this._所持 + 金額 < 0) {
        if (強制) {
          this._所持 = 0;
        }
        return false;
      }
      this._所持 += 金額;
      return true;
    }

    ヘッダー用出力() {
      return 強調テキスト(undefined, this._所持, this.#単位);
    }

    get 所持() {
      return this._所持;
    }

    _所持;
    #単位;

    static オブジェクトから(オブジェクト, 単位) {
      return new 通貨(オブジェクト?._所持 ?? 0, 単位);
    }
  }


  class メンバーの職業 {
    constructor(職業名, SP) {
      this.#職業 = 転職可能な職業.一覧(職業名);
      this._職業名 = 職業名;
      this._SP = SP;
    }

    レベルアップ(ステータス) {
      ステータス.増加(this.#職業.成長結果取得());
      this._SP += 1;
    }

    toString() {
      return `${this._職業名}(${this._SP})`;
    }

    アイコン名を取得(性別) {
      return this.#職業.アイコン名を取得(性別);
    }

    get 名前() { return this._職業名; }
    get SP() { return this._SP }

    static オブジェクトから(オブジェクト) {
      return new メンバーの職業(オブジェクト._職業名, オブジェクト._SP);
    }

    get _職業() { return this.#職業; }

    _職業名;
    _SP;

    #職業;
  }

  class ジョブマスターの職業 extends メンバーの職業 {
    constructor(職業名, SP, 性別) {
      super(職業名, SP);
      this._性別 = 性別;
    }

    static 図鑑出力(ジョブマスターの職業リスト) {
      const
        ジョブマスターの職業一覧 = new Map(ジョブマスターの職業リスト.map(ジョブマスターの職業.#一覧へ)),
        断片 = document.createDocumentFragment();
      let 改行する = 0;
      let tr;
      for (const _職業 of 転職可能な職業.全て()) {
        if (改行する++ % ジョブマスターの1行の職業数 === 0) {
          tr = document.createElement("tr");
          断片.appendChild(tr);
        }
        const ジョブマスター状況 = ジョブマスターの職業一覧.get(_職業.名前);
        tr.appendChild(_職業.図鑑用出力(ジョブマスター状況?._性別, ジョブマスター状況?._SP));
      }
      $id("ジョブマスター率").textContent = 転職可能な職業.ジョブマスター率を取得(ジョブマスターの職業一覧.size);
      return 断片;
    }

    static オブジェクトから({ _職業名, _SP, _性別 }) {
      return new ジョブマスターの職業(_職業名, _SP, _性別);
    }

    // TODO 名前をまともに
    static #一覧へ(オブジェクト) {
      const _ジョブマスターの職業 = ジョブマスターの職業.オブジェクトから(オブジェクト);
      return [_ジョブマスターの職業.名前, _ジョブマスターの職業];
    }

    _性別;
  }

  class 職業 {
    constructor(スキルリスト) {
      this.#名前 = this.constructor.name;
      this.#スキルリスト = スキルリスト;
    }

    set スキルリスト(スキルリスト) { this.#スキルリスト = スキルリスト; }
    get 名前() { return this.#名前; }

    をマスターした(SP) {
      return !this.#スキルリスト.values().some((スキル) => !スキル.は使用可能(SP, Infinity));
    }

    スキルを取得(スキル名, SP, ＭＰ) {
      const スキル = this.#スキルリスト.get(スキル名);
      return スキル?.は使用可能(SP, ＭＰ) ? スキル : undefined;
    }

    * 使用可能なスキルリスト(SP, ＭＰ) {
      for (const スキル of this.#スキルリスト.values()) {
        if (!スキル.は使用可能(SP, ＭＰ))
          continue;
        yield スキル;
      }
    }

    #名前;
    #スキルリスト;
  }

  class 転職可能な職業 extends 職業 {
    constructor(ＨＰ成長率, ＭＰ成長率, 攻撃力成長率, 守備力成長率, 素早さ成長率, スキル, 転職条件) {
      super(スキル);
      this.#ID = 転職可能な職業.#自動ID++;
      this.#成長率 = new 成長率(ＨＰ成長率, ＭＰ成長率, 攻撃力成長率, 守備力成長率, 素早さ成長率);
      this.#転職条件 = 転職条件;
    }

    成長結果取得() {
      return this.#成長率.成長結果取得();
    }

    // 性別 === undefined なら未転職
    // SP === undefined なら未マスター
    図鑑用出力(性別, SP) {
      const
        td = document.createElement("td"),
        div = document.createElement("div"),
        img = document.createElement("img");
      div.classList.add("ジョブマスターの職業");
      if (性別 === undefined) {
        td.classList.add("未転職");
        img.src = デフォルトの職業アイコン名;
      }
      else {
        img.src = this.アイコン名を取得(性別);
        img.alt = this.名前;
      }
      if (SP !== undefined) {
        const div = document.createElement("div");
        div.classList.add("ジョブマスター済み");
        div.textContent = `★SP${SP}`;
        div.appendChild(div);
      }
      else {
        div.classList.add("未マスター");
      }
      div.appendChild(img);
      div.appendChild(document.createTextNode(this.名前));
      td.appendChild(div);
      return td;
    }

    アイコン名を取得(性別, 合体している = false) {
      return `job/${this.#ID}_${性別をアイコン名に[性別]}${合体している ? "_mix" : 空文字列}.gif`;
    }

    に転職できる(メンバー) {
      return メンバー.現職名または前職名(this.名前) || (this.#転職条件?.を満たしている(メンバー) ?? true);
    }

    get 転職条件() { return this.#転職条件; }

    static 一覧(名前, エラーを出す = true) {
      return 転職可能な職業.#一覧.get(名前) ?? ((!エラーを出す || console.error(`転職可能な職業「${名前}」は存在しません`)) ? undefined : undefined);
    }

    static * 全て() {
      for (const _転職可能な職業 of 転職可能な職業.#一覧.values()) {
        yield _転職可能な職業;
      }
    }

    static 転職先候補出力(メンバー) {
      const 断片 = document.createDocumentFragment();
      for (const _転職可能な職業 of 転職可能な職業.#一覧.values()) {
        if (!_転職可能な職業.に転職できる(メンバー)) {
          continue;
        }
        const span = document.createElement("span");
        span.textContent = _転職可能な職業.名前;
        チャットフォーム.文字列追加イベントを登録(span, `＠てんしょく>${_転職可能な職業.名前} `);
        断片.append(span, " / ");
      }
      return 断片;
    }

    static ランダム取得() {
      return ランダムな1要素(Array.from(転職可能な職業.#一覧.values()));
    }

    static 初期化() {
      転職可能な職業.#一覧 = new Map([
        new 転職可能な職業("----", 0, 0, 0, 0, 0, new 転職条件(空配列)),

        new 戦士(),
        new 剣士(),
        new 騎士(),
        new 武闘家(),
        new 僧侶(),
        new 魔法使い(),
        new 商人(),
        new 遊び人(),
        new 盗賊(),
        new 羊飼い(),
        new 弓使い(),
        new 魔物使い(),

        new 吟遊詩人(),
        new 踊り子(),
        new 黒魔道士(),
        new 白魔道士(),

        new 聖騎士(),
        new 天使(),
        new 闇魔道士(),
        new 悪魔(),

        new ﾊﾞｰｻｰｶｰ(),
        new 暗黒騎士(),

        new 竜騎士(),
        new 魔剣士(),
        new ﾓﾝｸ(),
        new 忍者(),
        new 風水士(),
        new 侍(),
        new 時魔道士(),
        new 赤魔道士(),
        new 青魔道士(),
        new 召喚士(),

        new 賢者(),

        new 勇者(),
        new 魔王(),

        new ものまね士(),
        new 結界士(),
        new ﾊﾞﾝﾊﾟｲｱ(),
        new ｽﾗｲﾑ(),
        new ﾊｸﾞﾚﾒﾀﾙ(),
        new ﾄﾞﾗｺﾞﾝ(),
        new ｱｻｼﾝ(),

        new 医術師(),

        new ﾁｮｺﾎﾞ(),
        new ﾓｰｸﾞﾘ(),

        new ｷﾞｬﾝﾌﾞﾗｰ(),

        new ｿﾙｼﾞｬｰ(),
        new 堕天使(),

        new たまねぎ剣士(),

        new ｱｲﾃﾑ士(),
        new 光魔道士(),

        new 魔人(),

        new 蟲師(),

        new 魔銃士(),
        new 妖精(),
        new ﾐﾆﾃﾞｰﾓﾝ(),
        new ｴﾙﾌ(),
        new ﾀﾞｰｸｴﾙﾌ(),
        new ｽﾗｲﾑﾗｲﾀﾞｰ(),
        new ﾄﾞﾗｺﾞﾝﾗｲﾀﾞｰ(),
        new ﾈｸﾛﾏﾝｻｰ(),
        new ﾊﾞｯﾄﾏｽﾀｰ(),
        new ｷﾉｺﾏｽﾀｰ(),
        new ｵﾊﾞｹﾏｽﾀｰ(),
        new ｹﾓﾉﾏｽﾀｰ(),
        new ﾄﾞｸﾛﾏｽﾀｰ(),
        new ﾊﾞﾌﾞﾙﾏｽﾀｰ(),
        new ｺﾛﾋｰﾛｰ(),
        new ﾌﾟﾁﾋｰﾛｰ(),

        new 天竜人(),

        new ﾁｮｺﾎﾞﾗｲﾀﾞｰ(),
        new 算術士(),

        new すっぴん()

      ].map((転職可能な職業) => [転職可能な職業.名前, 転職可能な職業]));
    }

    static ジョブマスター率を取得(ジョブマスターした職業の数) {
      return Math.trunc(ジョブマスターした職業の数 / 転職可能な職業.#一覧.size);
    }

    static get デフォルト() {
      return this.一覧("----");
    }

    #ID;
    #成長率;
    #転職条件;

    static #一覧;
    static #自動ID = 0;
    static #デフォルトの職業;
  }

  class 成長率 extends ステータス {
    成長結果一括取得(レベル) {
      const 成長 = new ステータス();
      for (const i = 0; i < レベル; i += 1) {
        成長.増加(this.成長取得(), false);
      }
      return 成長;
    }

    成長結果取得() {
      return 成長結果取得(this);
    }

    static 成長結果取得(最大成長値) {
      return new ステータス(
        this.#単独取得(最大成長値.ＨＰ) + 1,
        this.#単独取得(最大成長値.ＭＰ),
        this.#単独取得(最大成長値.攻撃力),
        this.#単独取得(最大成長値.守備力),
        this.#単独取得(最大成長値.素早さ)
      );
    }

    static #単独取得(最大成長値) {
      const 成長値 = 整数乱数(最大成長値);
      return 成長値 > 9 ? Math.floor(Math.random() * 9) + 1 : 成長値;
    }
  }

  class 転職条件 {
    constructor(前職候補, 性別, アイテム名, 実績名, 実績以上) {
      this.#前職候補 = new Set(前職候補);
      this.#性別 = 性別;
      this.#アイテム名 = アイテム名;
      this.#実績名 = 実績名;
      this.#実績以上 = 実績以上;
    }

    を満たしている(メンバー) {
      return !!(
        (!this.#性別 || this.#性別 === this.#性別) &&
        (!this.#前職候補 || this.#前職候補.has(メンバー.現職.名前) || this.#前職候補.has(メンバー.前職?.名前)) &&
        (!this.#アイテム名 || メンバー.装備中(this.#アイテム名)) &&
        (!this.#実績名 || メンバー.実績[this.#実績名] >= this.#実績以上)
      );
    }

    消費アイテム名を取得(メンバー) {
      return this.#アイテム名;
    }

    static 職業と実績(職業名, 実績名, 実績以上) {
      return new this(職業名, undefined, undefined, 実績名, 実績以上);
    }

    static 性別(性別) {
      return new this(undefined, 性別);
    }

    static 性別とアイテム(性別, アイテム) {
      return new this(undefined, 性別, アイテム);
    }

    static アイテム(アイテム名) {
      return new this(undefined, undefined, アイテム名);
    }

    static アイテムと実績(アイテム名, 実績名, 実績以上) {
      return new this(undefined, undefined, アイテム名, 実績名, 実績以上);
    }

    static 実績(実績名, 実績以上) {
      return new this(undefined, undefined, undefined, 実績名, 実績以上);
    }

    #前職候補;
    #性別;
    #アイテム名;
    #実績名;
    #実績以上;
  }

  // デフォルトに忠実
  class 遊び人だとアイテム消費免除だがアイテムを装備していないと候補に出ない転職条件 extends 転職条件 {
    消費アイテム名を取得(メンバー) {
      if (メンバー.現職名または前職名("遊び人")) {
        return undefined;
      }
      return super.消費アイテム名を取得(メンバー);
    }
  }

  class 遊び人だとアイテム消費免除の転職条件 extends 遊び人だとアイテム消費免除だがアイテムを装備していないと候補に出ない転職条件 {
    を満たしている(メンバー, 実績) {
      return メンバー.現職名または前職名("遊び人") || super.を満たしている(メンバー, 実績);
    }
  }

  class 場所 {
    constructor(背景画像, 訪問方法 = 場所._訪問方法.特殊, _NPC) {
      const 名前 = this.constructor.name;
      this._名前 = 名前;
      this._背景画像 = 背景画像;
      this._訪問方法 = 訪問方法;
      this._チャット欄 = new チャット欄(名前);
      this._NPC = _NPC;
    }

    更新要求() {
      更新日時.更新();
      new 場所別キャラクター読み込み君(this);
    }

    メイン(キャラクターリスト) {
      this._キャラクターリスト = キャラクターリスト;
      this._名前からキャラクター取得用キャッシュ = new Map(Array.from(キャラクターリスト, 場所.#一覧生成, 場所));
      const チャット内容 = $encode(チャットフォーム.内容);
      チャットフォーム.保存した内容を消去();
      あなた.チャット書き込み予約(チャット内容);
      try {
        this.#こうどうを実行(チャット内容);
        あなた.予約チャットを書き込んでから読み込む();
      }
      catch (e) {
        // 意図的な処理停止でないなら
        if (typeof e !== "string") {
          throw e;
        }
        else {
          console.log(e);
        }
        // TODO マルチならチャット更新&画面更新
      }
    }

    ヘッダー出力(オーバーライド場所名) {
      const 断片 = document.createDocumentFragment();
      断片.appendChild(this._ヘッダー用出力(オーバーライド場所名));
      断片.appendChild(あなた.メンバー.ヘッダー用出力());
      return 断片;
    }

    固定NPC出力() {
      return this._NPC.場所用出力();
    }

    メンバー出力() {
      const 断片 = document.createDocumentFragment();
      if (this._NPC) {
        断片.appendChild(this._NPC.場所用出力());
      }
      for (const キャラクター of this._キャラクターリスト) {
        断片.appendChild(キャラクター.場所用出力());
      }
      return 断片;
    }

    こうどう出力() {
      const 断片 = document.createDocumentFragment();
      if (!this._こうどうリストリスト) {
        return 断片;
      }
      for (const こうどうリスト of this._こうどうリストリスト) {
        断片.appendChild(こうどうリスト.出力());
      }
      return 断片;
    }

    チャット出力() {
      return this._チャット欄.出力();
    }

    チャットを書き込んでから読み込む(チャット) {
      if (チャット === undefined && this._NPCのチャット === undefined) {
        データベース操作.場所別ログを読み込む(this.ログ名, this.ログ読み込み後の処理.bind(this));
        return;
      }
      const 対象チャット = [チャット, this._NPCのチャット].filter(場所.#未定義でない要素);
      データベース操作.チャットを書き込んでから読み込む(対象チャット, this.ログ名, this.ログ読み込み後の処理.bind(this));
      this._NPCのチャット = undefined;
    }

    NPCに話させる(内容, 宛て先) {
      if (this._NPCのチャット) {
        this._NPCのチャット.内容追加(内容, 宛て先);
      }
      else {
        this._NPCのチャット = (this._NPC ?? 場所.#チャットのデフォルトNPC).チャット(内容, 宛て先);
      }
    }

    get 名前() { return this._名前; }
    get 背景画像() { return this._背景画像; }
    get ログ名() { return this.名前; }

    static 初期化() {
      場所.#チャットのデフォルトNPC = new キャラクター(チャットのデフォルトのNPC名);
      一般的な場所.初期化();
      場所.#一覧 = new Map([
        new 冒険に出る(),
        new カジノ(),
        new 預かり所(),
        new 武器屋(),
        new 防具屋(),
        new 道具屋(),
        new 秘密の店(),
        new ルイーダの酒場(),
        new 福引所(),
        new モンスターじいさん(),
        new フォトコン会場(),
        new オラクル屋(),
        new 闇市場(),
        new メダル王の城(),
        new ダーマ神殿(),
        new 交流広場(),
        new オークション会場(),
        new イベント広場(),
        new 願いの泉(),
        new 復活の祭壇(),
        new ギルド協会(),
        new 命名の館(),
        new 追放騎士団(),
        new 何でも屋(),
        new 錬金場(),
        new 天界(),
        new 町("ガイア国", "quest.gif", 10, new Set(["021", "022", "023", "024", "025", "026", "027", "028"]), 5000, 20),
        new 町("スライム町", "stage16.gif", 10, new Set(["013", "014", "015", "016", "017", "018", "019", "020"]), 3000, 15),
        new 町("キノコ町", "park.gif", 10, new Set(["005", "006", "007", "008", "009", "010", "011", "012"]), 1500, 10),
        new 町("メケメケ村", "stage8.gif", 10, new Set(["001", "002", "003", "004"]), 500, 5)
      ].map(場所.#一覧生成, 場所));
    }

    static * 全場所名(訪問方法) {
      for (const [名前, _場所] of 場所.#一覧) {
        if (訪問方法 !== undefined && _場所._訪問方法 !== 訪問方法) {
          continue;
        }
        yield 名前;
      }
    }

    static 一覧(場所名, エラーを出す = true) {
      return 場所.#一覧.get(場所名) ?? ((!エラーを出す || console.error(`場所「${場所名}」は存在しません`)) ? undefined : undefined);
    }

    static 一時的な場所を登録(名前, _場所) {
      if (_場所 instanceof クエスト)
        場所.#クエスト一覧.set(名前, _場所);
      else if (_場所 instanceof 家)
        場所.#家一覧.set(名前, _場所);
      else if (_場所 instanceof ギルド)
        場所.#ギルド一覧.set(名前, _場所);
      else
        throw new TypeError(`${場所}は有効な場所ではありません`);
      場所.#一覧.set(名前, _場所);
    }

    static 一時的な場所を自動削除() {
      for (const 場所リスト of [場所.#家一覧, 場所.#ギルド一覧, 場所.#クエスト一覧])
        for (const _場所 of 場所リスト)
          if (_場所.最終更新日時 + 一時的な場所の自動削除秒数 < 更新日時.取得())
            _場所.削除();
    }

    static 家一覧(所有者名) {
      if (場所.#家一覧.has(場所名)) {
        return 場所.#家一覧.get(場所名);
      }
      あなた.家を検索して移動(所有者名);
      throw "非同期処理";
    }

    static クエスト一覧(クエスト名, エラーを出す = true) {
      return 場所.#クエスト一覧.get(場所名) ?? ((!エラーを出す || エラー.表示("すでにパーティーが解散してしまったようです")) ? undefined : undefined);
    }

    static ギルド一覧(ギルド名) {
      if (場所.#ギルド一覧.has(ギルド名)) {
        return 場所.#ギルド一覧.get(ギルド名);
      }
      あなた.ギルドを検索して移動(所有者名);
      throw "非同期処理";
    }

    _名前からキャラクター取得(名前) {
      return this._名前からキャラクター取得用キャッシュ.get(名前);
    }

    _NPCをしらべる(通知内容, クリック時文字列) {
      通知欄.追加(通知内容 ?? `しかし何も見つからなかった…`, クリック時文字列);
    }

    _はなす(...言葉リスト) {
      if (!言葉リスト?.length) {
        通知欄.追加("返事がない、ただのしかばねのようだ…");
        return;
      }
      this.NPCに話させる(ランダムな1要素(言葉リスト));
    }

    _ヘッダー用出力(オーバーライド場所名, 半角スペースを入れる = true) {
      return document.createTextNode(`【${オーバーライド場所名 ?? this.名前}】${半角スペースを入れる ? " " : 空文字列}`);
    }

    _名前;
    _NPC;
    _背景画像;
    _こうどうリストリスト = [];
    _キャラクターリスト = new Set();
    _チャット欄;
    _NPCの発言;

    ログ読み込み後の処理(データベースイベント) {
      this._チャットリスト = new Set(データベースイベント.target.result.map(チャット.オブジェクトから));
      this._チャット欄.更新(this._チャットリスト);
      あなた.メンバー.データベースに保存();
      画面.一覧("ゲーム画面").更新(this);
    }

    #こうどうを実行(チャット内容) {
      const こうどう情報 = チャット内容.match(場所.#こうどう名抽出);
      if (!こうどう情報) {
        return false;
      }
      const [, こうどう名, 対象] = こうどう情報;
      for (const こうどうリスト of this._こうどうリストリスト) {
        if (こうどうリスト.名前が一致したこうどうを実行(こうどう名, 対象)) {
          return true;
        }
      }
      return false;
    }

    static #一覧生成(場所) {
      return [場所.名前, 場所];
    }

    static #ギルドを登録() {

    }

    static #未定義でない要素(要素) {
      return 要素 !== undefined;
    }

    static #一覧;
    static #家一覧 = new Map(); // TODO [所有者名, new 家]
    static #クエスト一覧 = new Map(); // TODO [クエスト名, new クエスト]
    static #ギルド一覧 = new Map(); // TODO [ギルド名, new ギルド]

    static #チャットのデフォルトNPC;
    static #こうどう名抽出 = new RegExp(/＠(.+?)(?:[\x20　]?&gt;(.+?))?(?:[\x20　]|$)/);
    static _訪問方法 = Object.freeze({
      特殊: Symbol("特殊"),
      いどう: Symbol("いどう"),
      まち: Symbol("まち")
    });
  }

  class 一般的な場所 extends 場所 {
    constructor() {
      super(...arguments);
      this._こうどうリストリスト = [一般的な場所._一般的なこうどう];
    }

    static 初期化() {
      一般的な場所._一般的なこうどう = new こうどうマネージャー(null,
        new いどう(),
        new まち(),
        new こうどう("ほーむ", () => { あなた.プレイヤーの家に移動(); }),
        new こうどう("ぎるど", () => { console.log("guild"); }, () => あなた.メンバー.ギルド === undefined ? こうどう.状態.無効 : こうどう.状態.有効),
        new こうどう("ささやき", () => { console.log("ささやき"); }),
        new こうどう("はなす", () => { あなた.現在地._はなす(); }),
        new こうどう("しらべる", (対象) => { あなた.チャット書き込み停止(); if (あなた.現在地._NPC?.名前 === 対象) { あなた.現在地._NPCをしらべる(); return; } console.log("プレイヤーデータ"); }),
        new こうどう("ろぐあうと", () => { あなた.ろぐあうと(); }),
        new こうどう("すくしょ", () => { console.log("syo"); }),
        new こうどう("ボーナス", () => {
          あなた.メンバー.所持金.収支(10000);
          あなた.メンバー.カジノコイン.収支(10000);
          あなた.メンバー._福引券.収支(1000);
          あなた.メンバー._レアポイント.収支(10);
          あなた.メンバー._小さなメダル.収支(100);
        })
      )
    }

    _一般的なこうどう;
  }

  class 冒険に出る extends 一般的な場所 {
    constructor() {
      super("quest.gif", 場所._訪問方法.いどう);
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new クエストをつくる(),
        new こうどう()
      ));
    }

    ヘッダー出力() {
      const 出力 = super.ヘッダー出力("冒険中のパーティー");
      return 出力;
    }
  }

  class カジノ extends 一般的な場所 {
    constructor() {
      super("casino.gif", 場所._訪問方法.いどう, new キャラクター("@ﾊﾞﾆｰ", "chr/020.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new こうどう("つくる"),
        new こうどう("さんか"),
        new こうどう("けんがく"),
        new こうどう("＄1すろっと", () => { this.#スロット(1); }),
        new こうどう("＄10すろっと", () => { this.#スロット(10); }),
        new こうどう("＄50すろっと", () => { this.#スロット(50); }),
        new こうどう("＄100すろっと", () => { this.#スロット(100); }),
        new こうどう("こうかん"),
        new こうどう("りょうがえ")
      ));
    }

    ヘッダー出力() {
      const 断片 = document.createDocumentFragment();
      断片.append(
        super._ヘッダー用出力(),
        ` コイン`,
        あなた.メンバー.カジノコイン.ヘッダー用出力(),
        "枚 / ゴールド",
        あなた.メンバー.所持金.ヘッダー用出力(),
        "G"
        // TODO 部屋一覧
      );
      return 断片;
    }

    _はなす() {
      super._はなす(
        "コインは１枚20Gです☆",
        "ゴールドをコインに両替してね☆",
        "賞品は他ではなかなか手に入れることができないレアなアイテムばかりよ☆",
        "スロットの絵柄を３つそろえるとコインが増えて幸せになれるわよ☆",
        "ゆっくりしていってね☆"
      );
    }

    _NPCをしらべる() {
      super._NPCをしらべる(`${this._NPC.名前}「きゃぁッ☆エッチィ～☆」`);
    }

    #スロット(賭けた枚数) {
      if (あなた.メンバー.疲労確認()) {
        return;
      }
      if (!あなた.メンバー.カジノコイン.収支(-賭けた枚数)) {
        通知欄.追加(`＄${賭けた枚数}スロットをするコインが足りません。「＠りょうがえ」でコインを両替してください`, "＠りょうがえ ");
        return;
      }
      // TODO 行動時間半減
      const
        結果 = [
          ランダムな1要素(カジノのスロットの記号リスト),
          ランダムな1要素(カジノのスロットの記号リスト),
          ランダムな1要素(カジノのスロットの記号リスト)
        ],
        通知内容 = [
          `$${賭けた枚数}スロット`,
          `【${結果[0].記号}】【${結果[1].記号}】【${結果[2].記号}】`
        ];
      let 払い戻し = 0;
      if (結果[0] === 結果[1]) {
        if (結果[1] === 結果[2]) {
          払い戻し = 賭けた枚数 * 結果[0].倍率;
          通知内容.push(
            `なんと!! ${結果[0].記号} が3つそろいました!!`,
            "おめでとうございます!!",
            `***** コイン ${払い戻し} 枚 GET !! *****`
          );
        }
        else if (結果[0].おまけの倍率) {
          払い戻し = 賭けた枚数 * 結果[0].おまけの倍率;
          通知内容.push(
            "チェリーが2つそろいました♪",
            `コイン ${払い戻し} 枚Up♪`
          );
        }
      }
      if (払い戻し === 0) {
        通知内容.push("ハズレ");
      }
      あなた.メンバー.カジノコイン.収支(払い戻し);
      通知欄.追加(通知内容, `＠＄${賭けた枚数}すろっと`);
    }
  }

  class スロットの記号 {
    constructor(記号, 倍率, おまけの倍率) {
      this.#記号 = 記号;
      this.#倍率 = 倍率;
      this.#おまけの倍率 = おまけの倍率;
    }

    get 記号() { return this.#記号; }
    get 倍率() { return this.#倍率; }
    get おまけの倍率() { return this.#おまけの倍率 }

    #記号;
    #倍率;
    #おまけの倍率;
  }

  class 預かり所 extends 一般的な場所 {
    constructor() {
      super("depot.gif", 場所._訪問方法.いどう, new キャラクター("@ﾆｷｰﾀ", "chr/003.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new こうどう("うる"),
        new こうどう("あずける"),
        new こうどう("ひきだす"),
        new こうどう("おくる")
      ));
    }

    _はなす() {
      super._はなす(
        `ここは${this.名前}だけど、何か用かい？`,
        `${あなた}は、最大$max_depot個まで預けることができるぜ`,
        "転職回数が増えるごとに預けられる個数も増えていくぜ",
        "＠おくる時は、送るアイテムと相手の名前を教えてくれな",
        "＠せいとんすると、武器、防具、道具の順に整頓できるぜ",
        "預かり所がまんぱんだと、相手からのアイテムが受け取れないぜ",
        "預かり所がまんぱんだと、クエストでの宝物を手に入れることができないぜ",
        "ここで売るのも専門店で売るのも売値は変わらないぜ"
      );
    }

    ヘッダー出力() {
      const 断片 = document.createDocumentFragment();
      断片.append(
        this._ヘッダー用出力(),
        強調テキスト(`倉庫：`, 999, "/", 99999, ` / `),
        あなた.メンバー.ヘッダー用出力()
      );
      return 断片;
    }
  }

  class 店インターフェース extends 一般的な場所 {
    constructor(背景画像, 訪問方法, キャラクター,
      商品の種類, 販売価格係数, 陳列棚表示時の通知内容, 金欠時の通知内容,
      購入のためのこうどう名 = "かう") {
      super(背景画像, 訪問方法, キャラクター);
      this.#商品の種類 = 商品の種類;// TODO getPrototypeOf?
      this.#販売価格係数 = 販売価格係数;
      this.#陳列棚表示時の通知内容 = 陳列棚表示時の通知内容;
      this.#金欠時の通知内容 = 金欠時の通知内容;
      this.#購入のためのこうどう名 = 購入のためのこうどう名;
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new こうどう(購入のためのこうどう名, this._かう.bind(this), undefined, this._かうクリック時),
      ));
    }

    _かう() { throw new Error("未定義です"); }

    _かうクリック時(販売アイテムリスト) {
      通知欄.追加([
        this.#陳列棚表示時の通知内容,
        this.#商品の種類.陳列棚出力(販売アイテムリスト.values(), this.#購入のためのこうどう名, this.#販売価格係数)
      ]);
    }

    _かうメイン(商品, 通貨) {
      if (!通貨.収支(-商品.価値 * this.#販売価格係数)) {
        通知欄.追加(this.#金欠時の通知内容 ?? this._金欠時の通知内容を取得(商品));
        return;
      }
      if (!this._装備時の会話内容を取得) {
        あなた.メンバー.倉庫にアイテムを送る(商品.アイテム名);
        this.NPCに話させる(this._倉庫送信時の会話内容を取得(商品));
        return;
      }
      this.NPCに話させる(
        (あなた.メンバー.装備または倉庫に送る(商品.アイテム名) ? this._装備時の会話内容を取得 : this._倉庫送信時の会話内容を取得)(商品)
      );
    }

    _倉庫送信時の会話内容を取得(取引アイテム) { throw new Error("未設定です"); }
    _売却確認時の通知内容を取得(アイテム名, 売却価格) { throw new Error("未設定です"); }
    _売却時の会話内容を取得(アイテム名, 売却価格) { throw new Error("未設定です"); }

    #商品の種類;
    #販売価格係数;
    #陳列棚表示時の通知内容;
    #金欠時の通知内容;
    #購入のためのこうどう名;
  }

  class 販売店 extends 店インターフェース {
    // 候補はアイテムのインスタンスのリスト
    // TODO 何でも屋は除外
    _かう(商品名) {
      const
        商品 = アイテム.一覧(商品名, false),
        品揃え = this._品揃えアイテム名リストを取得(),
        候補 = new Set(品揃え);
      if (!候補.has(商品名)) {
        this._かうクリック時(アイテム.リスト(品揃え));
        return;
      }
      this._かうメイン(商品, あなた.メンバー.所持金);
    }

    _かうクリック時(販売アイテムリスト = アイテム.リスト(this._品揃えアイテム名リストを取得())) {
      super._かうクリック時(販売アイテムリスト);
    }

    _品揃えアイテム名リストを取得() { return 空配列; }
  }

  class 専門店 extends 販売店 {
    constructor(背景画像, 訪問方法, キャラクター, 商品の種類, 販売価格係数, 陳列棚表示時の通知内容, 金欠時の通知内容, 購入のためのこうどう名,
      買取価格係数 = 0.5) {
      super(...arguments);
      this._こうどうリストリスト[0].こうどう追加(
        new こうどう("うる", this._うる.bind(this), undefined, this._うるクリック時.bind(this))
      );
      this.#買取価格係数 = 買取価格係数;
    }

    _うる(対象, 装備中のアイテム) {
      if (装備中のアイテム === undefined || 装備中のアイテム !== 対象) {
        this._うるクリック時();
        return;
      }
      const 売却価格 = アイテム.一覧(対象).価値 * this.#買取価格係数;
      あなた.メンバー.装備アイテムを売る(対象, 売却価格);
      あなた.現在地.NPCに話させる(this._売却時の会話内容を取得(対象, 売却価格));
    }

    _うるクリック時(装備中のアイテム, 無装備時の通知内容) {
      if (装備中のアイテム === undefined) {
        通知欄.追加(無装備時の通知内容);
        return;
      }
      console.log(アイテム.一覧(装備中のアイテム));
      const 売却価格 = アイテム.一覧(装備中のアイテム).価値 * this.#買取価格係数;
      通知欄.追加(this._売却確認時の通知内容を取得(装備中のアイテム, 売却価格), `＠うる>${装備中のアイテム} `);
    }

    #買取価格係数;
  }

  class 交換所 extends 店インターフェース {
    constructor(背景画像, 訪問方法, キャラクター, 商品の種類, 販売価格係数, 陳列棚表示時の通知内容, 金欠時の通知内容, 購入のためのこうどう名,
      販売取引アイテムリスト) {
      super(...arguments);
      this.#販売取引アイテムリスト = new Map(販売取引アイテムリスト.map((取引アイテム) => [取引アイテム.名前, 取引アイテム]));
    }

    _かう(商品名, 通貨) {
      const 商品 = this.#販売取引アイテムリスト.get(商品名);
      if (商品 === undefined) {
        this._かうクリック時(this.#販売取引アイテムリスト);
        return;
      }
      this._かうメイン(商品, 通貨);
    }

    _かうクリック時(販売取引アイテムリスト = this.#販売取引アイテムリスト) {
      super._かうクリック時(販売取引アイテムリスト);
    }

    #販売取引アイテムリスト;
  }

  class 武器屋 extends 専門店 {
    constructor() {
      super("weapon.gif", 場所._訪問方法.いどう, new キャラクター("@ﾌﾞｯｷｰ", "chr/005.gif"),
        武器, 2, "何を買うんだい？", "お金が足りないみたいだぜ");
    }

    _はなす() {
      super._はなす(
        "ここは武器屋だ！戦いに武器は必須だぜ！",
        `${あなた}には$weas[$sales[int(rand(@sales))]][1]なんか良いんじゃねぇか？`,
        `${あなた}には$weas[$sales[int(rand(@sales))]][1]がオススメだ！`,
        "銅の剣はどぉの剣？",
        "よぉ！何か買っていくのか？",
        "素早さが高いと会心の一撃や回避率が上がるぞ！",
        "攻撃力が高い分、重さも重くなり素早さが下がる。つまり、自分に合った装備をしろってことだ！",
        "この世界のどこかに、自分の強さにより武器の強さも変わる武器があるらしいぜ！",
        "モンスターにやられたとしてもお金が半分になることはないぜ！",
        `${あなた}の攻撃力は${あなた.メンバー._ステータス.攻撃力}か…。Lv.${あなた.メンバー._レベル}にしてはなかなかだな！`,
        `${あなた}の転職回数は${あなた.メンバー.転職回数}回か！転職回数が多ければ熟練者と見なし、もっと強い武器を売ってやるぜ！`
      );
    }

    _NPCをしらべる() {
      super._NPCをしらべる(`${this._NPC.名前}「おいおい、俺は武器じゃねぇぜ」`);
    }

    _うる(対象) {
      super._うる(対象, あなた.メンバー._武器);
    }

    _うるクリック時() {
      super._うるクリック時(あなた.メンバー._武器, `売るって何を売る気だ？${あなた}は武器を持っていないようだが`)
    }

    _品揃えアイテム名リストを取得() {
      const 品揃え = [...アイテム.名前範囲("ひのきの棒", "いばらのむち"), "ﾀﾞｶﾞｰﾅｲﾌ"];
      // デフォルトに忠実
      if (あなた.メンバー.転職回数 <= 11) {
        品揃え.push(アイテム.IDから(6 + あなた.メンバー.転職回数).名前);
      }
      else {
        品揃え.push(...アイテム.名前範囲("ﾌﾞﾛﾝｽﾞﾅｲﾌ", "ﾁｪｰﾝｸﾛｽ"));
      }
      return 品揃え;
    }

    _装備時の会話内容を取得(アイテム) { return `まいど！${アイテム.名前}だ！受けとってくれ！`; }
    _倉庫送信時の会話内容を取得(アイテム) { return `まいど！${アイテム.名前}は${あなた}の預かり所に送っておいたぜ！`; }
    _売却確認時の通知内容を取得(アイテム名, 売却価格) { return `${アイテム名}なら ${売却価格} Gで買い取るぜ！`; }
    _売却時の会話内容を取得(アイテム名, 売却価格) { return `${アイテム名} の買取代の ${売却価格} Gだ！`; }
  }

  class 防具屋 extends 専門店 {
    constructor() {
      super("armor.gif", 場所._訪問方法.いどう, new キャラクター("@ｱﾏﾉ", "chr/008.gif"),
        防具, 2, "どれを買うッスか？", "残念ながら、お金が足りないッス");
    }

    _はなす() {
      super._はなす(
        "ここは防具屋ッス！防具を装備すればダメージを減らすことができるッス！",
        "素早さがないと攻撃をかわすことができないッス！",
        "素早さに自信がない場合は、ステテコパンツがオススメッス！",
        "強さや重さは１回の戦闘ごとで変わるッス！",
        `${あなた}さんは$arms[$sales[int(rand(@sales))]][1]なんて似合いそうッスね！`,
        "重い鎧でガチガチに固めるか、ヒラヒラの服で回避率を上げるのか、どちらが好きッスか？",
        "いつかあっしもあぶない水着を着るのが夢ッス",
        `${あなた}さんの転職回数は${あなた.メンバー.転職回数}回ッスね！転職回数が多いと熟練者と見なし売れる物が増えるッス！`,
        `${あなた}さんの防御力は${あなた.メンバー._ステータス.守備力}ッスね！。なかなかの固さッスね！`
      );
    }

    _NPCをしらべる() {
      super._NPCをしらべる(`${this._NPC.名前}「な、な、何を見ているッスか！？」`)
    }

    _うる(対象) {
      super._うる(対象, あなた.メンバー._防具);
    }

    _うるクリック時() {
      super._うるクリック時(あなた.メンバー._防具, "売りたい防具がある場合は、装備してきて欲しいッス！");
    }

    _品揃えアイテム名リストを取得() {
      return [...アイテム.名前範囲("布の服", "皮の腰巻", あなた.メンバー.転職回数, "鋼鉄の鎧")];
    }

    _装備時の会話内容を取得(アイテム) { return `お買い上げありがとうッス！${アイテム.名前}どうぞ着てくださいッス`; }
    _倉庫送信時の会話内容を取得(アイテム) { return `お買い上げありがとうッス！${アイテム.名前}は${あなた}さんの預かり所に送っておいたッス！`; }
    _売却確認時の通知内容を取得(アイテム名, 売却価格) { return `${アイテム名}なら ${売却価格} Gで買い取るッス！`; }
    _売却時の会話内容を取得(アイテム名, 売却価格) { return `${アイテム名} の買取代の ${売却価格} Gだ！`; }
  }

  class 道具屋 extends 専門店 {
    constructor() {
      super("item.gif", 場所._訪問方法.いどう, new キャラクター("@ｱｲﾃﾑｺ", "chr/004.gif"),
        道具, 2, "どれを買うニョ？", "ビンボーにゃの？働かにゃいの？");
      this._こうどうリストリスト[0].こうどう追加(new こうどう(
        "ひみつのみせ",
        () => { if (あなた.メンバー.転職回数 < /* TODO 7 */ 0) { return; } あなた.場所移動(場所.一覧("秘密の店")); },
        こうどう.状態固定.get(こうどう.状態.隠しコマンド)
      ));
    }

    _はなす() {
      super._はなす(
        `いらしゃいませぇ～ここは${this.名前}ニャ`,
        "冒険に出る前に道具があると便利ニャ",
        "初心者たんには薬草をオススメしてますぅ",
        "守りの石は相手からのだめぇじを軽減することができるらしいニャ",
        `${あなた}たんは顔色が悪そうなのでぇ、毒消し草を食べるといいニャ`,
        "この草おいしいニャ。モグモグ…。あぅっ！またお店の品を食べてしまったニャ…",
        "天使の鈴は頭が悪い人に使うといいらしぃニャ。あたしのことぢゃないニャ",
        `${あなた}たんの今日の夕食は薬草料理がオススメニャ`,
        `${あなた}たんはべじたりあんですかぁ？`,
        "魔法使いたんは魔法の聖水を持っていくとよいですよぉ",
        "この世界のどこかに秘密の店というあやしいお店があるらしいですよぉ",
        `今日のオススメ商品はコレニャ！じゃじゃ～ん <span class="強調">${ランダムな1要素(this._品揃えアイテム名リストを取得())}</span> ニャ！`
      );
    }

    _NPCをしらべる() {
      super._NPCをしらべる(`${this._NPC.名前}「ほえ？なんでしょうかぁ？」`, "＠ひみつのみせ に行きたい");
    }

    _うる(対象) {
      super._うる(対象, あなた.メンバー._道具);
    }

    _うるクリック時() {
      super._うるクリック時(あなた.メンバー._道具, "何を売るニョ？何も道具を持っていないニョ")
    }

    _品揃えアイテム名リストを取得() {
      const 転職回数 = あなた.メンバー.転職回数;
      return 転職回数 >= 7 ? ["薬草", "上薬草", "特薬草", "毒消し草", "満月草", "天使の鈴", "魔法の聖水", "戦いのﾄﾞﾗﾑ", "守りの石", "竜のｳﾛｺ", "ﾘｼﾞｪﾈﾎﾟｰｼｮﾝ", "ﾄﾞﾗｺﾞﾝ草", "爆弾石", "小人のﾊﾟﾝ", "基本錬金ﾚｼﾋﾟ"]
        : 転職回数 >= 5 ? ["薬草", "上薬草", "特薬草", "毒消し草", "満月草", "天使の鈴", "魔法の聖水", "戦いのﾄﾞﾗﾑ", "守りの石", "竜のｳﾛｺ", "ﾄﾞﾗｺﾞﾝ草", "爆弾石", "小人のﾊﾟﾝ", "基本錬金ﾚｼﾋﾟ"]
          : 転職回数 >= 3 ? ["薬草", "上薬草", "毒消し草", "満月草", "天使の鈴", "魔法の聖水", "守りの石", "竜のｳﾛｺ", "ﾄﾞﾗｺﾞﾝ草", "爆弾石", "基本錬金ﾚｼﾋﾟ"]
            : 転職回数 >= 1 ? ["薬草", "上薬草", "毒消し草", "満月草", "天使の鈴", "魔法の聖水", "守りの石", "竜のｳﾛｺ", "基本錬金ﾚｼﾋﾟ"]
              : ["薬草", "毒消し草", "満月草", "天使の鈴", "基本錬金ﾚｼﾋﾟ"]
    }

    _装備時の会話内容を取得(アイテム) { return `${アイテム.名前}ですね。はい、どうぞ！`; }
    _倉庫送信時の会話内容を取得(アイテム) { return `${アイテム.名前}は${あなた}ニャンの預かり所の方に投げましたニャ！`; }
    _売却確認時の通知内容を取得(アイテム名, 売却価格) { return `${アイテム名}なら ${売却価格} Gで買うニャ！`; }
    _売却時の会話内容を取得(アイテム名, 売却価格) { return `${売却価格} Gで ${アイテム名} を買い取りまちた`; }
  }

  class 秘密の店 extends 交換所 {
    constructor() {
      super("item.gif", 場所._訪問方法.特殊, new キャラクター("@ﾋﾐﾂｼﾞ", "chr/019.gif"),
        道具, 3, "どれを買うメェ～？", "お金が足らメェ～", "かう",
        ["ﾊﾟﾃﾞｷｱの根っこ", "魔法の鏡", "守りのﾙﾋﾞｰ", "銀のたてごと", "へんげの杖", "賢者の悟り", "精霊の守り", "伯爵の血"].map(アイテム名 => アイテム.一覧(アイテム名))
      );
      // TODO
      this._こうどうリストリスト[0].こうどう追加(new こうどう("ぱふぱふ", () => { this.NPCに話させる("未実装だメェ～。", あなた.toString()) }));
    }

    _はなす() {
      super._はなす(
        "バレちゃったメェ～。他の人には秘密だメェ～。",
        "値段は高いメェ～けれど、他では手に入らないレアものだメェ～。",
        "メェ～メェ～メェ～メェ～メェ～メェ～メェ～メェ～メェ～。",
        "ベェ～ベェ～ベェ～ベェ～ベェ～ベェ～ベェ～ベェ～ベェ～。",
        "＠ぱふぱふはサービスだメェ～。"
      );
    }

    _NPCをしらべる() {
      super._NPCをしらべる(`${this._NPC.名前}「オイラは羊の${this._NPC.名前}だメェ～。羊の国から来たよ…ゴホッゴホッ…羊の国から来たメェ～」`);
    }

    _かう(対象) {
      super._かう(対象, あなた.メンバー.所持金);
    }

    _装備時の会話内容を取得(アイテム) { return `${アイテム.名前}メェ～。持ってけメェ～`; }
    _倉庫送信時の会話内容を取得(アイテム) { return `${アイテム.名前}は${あなた}メェ～の預かり所の方に投げましたメェ～`; }
  }

  class ルイーダの酒場 extends 一般的な場所 {
    constructor() {
      super("bar.gif", 場所._訪問方法.いどう, new キャラクター("@ﾙｲｰﾀﾞ", "chr/009.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }

    ヘッダー出力() {
      const
        断片 = document.createDocumentFragment(),
        ステータス = あなた.メンバー.ステータス,
        ＨＰ = ステータス.ＨＰ,
        ＭＰ = ステータス.ＭＰ;
      断片.append(
        this._ヘッダー用出力(),
        `ゴールド：`,
        あなた.メンバー.所持金.ヘッダー用出力(),
        強調テキスト("G ＨＰ：", ＨＰ.現在値, "/", ＨＰ.最大値, " ＭＰ：", ＭＰ.現在値, "/", ＭＰ.最大値)
      );
      return 断片;
    }

    _はなす() {
      super._はなす(
        "いらっしゃい。何か食べてく？",
        `${あなた}さんは$foods[int(rand(@foods))][0]は好きかしら？`,
        "食材にＭＰを回復させる魔法の聖水やＨＰを回復させる薬草がふくまれているのよ",
        "ＨＰを回復させたいならデザートやご飯物を食べていくといいわ",
        "ＭＰを回復させたいならドリンクを飲んでいくといいわ",
        "食べたり飲んだりした後は、運動しなきゃね",
        "お酒は大人になってからね"
      );
    }
  }

  class 福引所 extends 一般的な場所 {
    constructor() {
      super("lot.gif", 場所._訪問方法.いどう, new キャラクター("@ﾌｸｽｹ", "chr/006.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new こうどう("ふくびき", () => { this._ふくびき(); }),
        new こうどう("しょうひん", () => { this._しょうひん(); })
      ));
      this.#特別な福引 = new 福引(300, "ｵｰﾌﾞ", "ｶﾞﾗ", 100,
        () => {
          return アイテム.範囲("ｽﾗｲﾑﾋﾟｱｽ", "ﾋｰﾛｰｿｰﾄﾞ2").ランダム取得().名前;
        },
        true,
        new 福引の賞品(null, "ｺﾞｰﾙﾄﾞ", "gold", 福引の台詞.特別な特賞, 3),
        new オーブの賞品("ｼﾙﾊﾞｰ", "silver", 12),
        new オーブの賞品("ﾚｯﾄﾞ", "red", 15),
        new オーブの賞品("ﾌﾞﾙｰ", "blue", 10),
        new オーブの賞品("ｸﾞﾘｰﾝ", "green", 10),
        new オーブの賞品("ｲｴﾛｰ", "yellow", 10),
        new オーブの賞品("ﾊﾟｰﾌﾟﾙ", "purple", 10),
        new 福引の賞品(null, "ﾎﾜｲﾄ", "white", 福引の台詞.特別なハズレ)
      );
      this.#通常の福引 = new 福引(3, "ｽﾗｲﾑ", "ﾌﾟﾆｮ", 1000,
        () => {
          return 更新日時.曜日に対応する要素を返す("賢者の悟り", "ﾄﾞﾗｺﾞﾝの心", "闇のﾛｻﾞﾘｵ", "魔銃", "ｷﾞｻﾞｰﾙの野菜", "ｸﾎﾟの実", "ｷﾞｬﾝﾌﾞﾙﾊｰﾄ")
        },
        false,
        new 福引の賞品(null, "金", "#FC3", 福引の台詞.特賞, 1, "特賞"),
        new 福引の賞品("精霊の守り", "赤", "#F33", 福引の台詞.超激レア, 3, "１等"),
        new 福引の賞品("ｽﾗｲﾑの心", "紫", "#C6F", 福引の台詞.超激レア, 4, "２等"),
        new 福引の賞品("小さなﾒﾀﾞﾙ", "黄", "#FF0", 福引の台詞.激レア, 6, "３等"),
        new 四等の賞品("命の木の実", 6),
        new 四等の賞品("不思議な木の実", 5),
        new 四等の賞品("力の種", 5),
        new 四等の賞品("守りの種", 5),
        new 四等の賞品("素早さの種", 5),
        new 四等の賞品("ｽｷﾙの種", 5),
        new 福引の賞品("祈りの指輪", "青", "#66F", 福引の台詞.レア, 10, "５等"),
        new 福引の賞品("福袋", "緑", "#3F3", 福引の台詞.普通, 20, "６等"),
        new 福引の賞品(null, "白", "#FFF", 福引の台詞.ハズレ)
      );
    }

    ヘッダー出力() {
      const 断片 = document.createDocumentFragment();
      断片.append(
        this._ヘッダー用出力(),
        `福引券`,
        あなた.メンバー._福引券.ヘッダー用出力(),
        `枚`
      );
      if (あなた.メンバー._道具) {
        断片.appendChild(document.createTextNode(` E：${あなた.メンバー._道具}`));
      }
      return 断片;
    }

    _はなす() {
      super._はなす(
        `福引券${this.#通常の福引.必要枚数}枚で１回まわすことができるよ`,
        "福引の賞品は「＠しょうひん」で確認してね",
        "特賞は曜日によって変わるよ",
        "福引券はルイーダの酒場で食事するともらえるよ",
        `${this.#特別な福引.必要枚数}枚以上福引券を持っている人は、特別な福引ができるよ`
      );
    }

    _NPCをしらべる() {
      super._NPCをしらべる([
        `なんと、${あなた}は福引券を見つけた！`,
        `${this._NPC.名前}「ダメだよ！あげないよ！」`
      ]);
    }

    _ふくびき() {
      this.#特別な福引.回す()
        || this.#通常の福引.回す(true);
    }

    _しょうひん() {
      if (あなた.メンバー._福引券.所持 >= this.#特別な福引.必要枚数) {
        通知欄.追加("裏福引の賞品リスト");
        this.#特別な福引.陳列棚出力();
      }
      else {
        通知欄.追加("福引の賞品リスト");
        this.#通常の福引.陳列棚出力();
      }
    }

    #特別な福引;
    #通常の福引;
  }

  class 福引 {
    constructor(必要枚数, 玉の種類, 擬音, 確率の分母, 特賞取得関数, 特賞を隠す, ...賞品) {
      this.#必要枚数 = 必要枚数;
      this.#玉の種類 = 玉の種類;
      this.#擬音 = 擬音;
      this.#確率の分母 = 確率の分母;
      this.#特賞取得関数 = 特賞取得関数;
      this.#特賞を隠す = 特賞を隠す;
      this.#賞品リスト = 賞品;
    }

    陳列棚出力() {
      const table = document.createElement("table");
      let
        前の賞品の型,
        特賞 = true;
      for (const 賞品 of this.#賞品リスト) {
        if (賞品.ハズレ) {
          break;
        }
        if (特賞) {
          特賞 = false;
          if (!this.#特賞を隠す) {
            table.appendChild(賞品.陳列棚用出力(this.#特賞取得関数()));
          }
          continue;
        }
        const 賞品の型 = Object.getPrototypeOf(賞品);
        if (賞品の型 !== 福引の賞品.prototype && 賞品の型 === 前の賞品の型) {
          continue;
        }
        table.appendChild(賞品.陳列棚用出力());
        前の賞品の型 = 賞品の型;
      }
      table.classList.add("table1");
      通知欄.追加(table);
    }

    出力(福引の賞品, 福引の賞品の出力) {
      const
        色付き文字 = document.createElement("span"),
        全体 = document.createElement("span");
      色付き文字.style.color = 福引の賞品.玉の色コード;
      色付き文字.textContent = `● 【${福引の賞品.玉の色名}${this.#玉の種類}】`;
      全体.append(
        `${this.#擬音}${this.#擬音}${this.#擬音}……ｺﾛｺﾛｺﾛ…...,,,`,
        色付き文字,
        福引の賞品の出力
      );
      if (福引の賞品.ハズレ) {
        const 残り回数 = Math.trunc(あなた.メンバー._福引券.所持 / this.#必要枚数);
        通知欄.追加([
          全体,
          (残り回数 > 0) ? `あと${残り回数}回まわせるよ` : "また挑戦してね"
        ]);
      }
      else {
        あなた.現在地.NPCに話させる(全体.innerHTML);
      }
    }

    回す(警告する = false) {
      if (!あなた.メンバー._福引券.収支(-this.#必要枚数)) {
        if (警告する) {
          通知欄.追加(`福引券を ${this.#必要枚数} 枚以上、持っていないようですねぇ…`);
        }
        return false;
      }
      let 乱数 = Math.random() * this.#確率の分母;
      for (const 賞品 of this.#賞品リスト) {
        const { 次の乱数, 出力 } = 賞品.抽選(乱数, this.#特賞取得関数);
        if (出力 !== undefined) {
          this.出力(賞品, 出力);
          break;
        }
        乱数 = 次の乱数;
      }
      return true;
    }

    get 必要枚数() {
      return this.#必要枚数;
    }

    #必要枚数;
    #玉の種類;
    #擬音;
    #確率の分母;
    #特賞取得関数;
    #特賞を隠す;
    #賞品リスト;
  }

  class 福引の賞品 {
    constructor(名前, 玉の色名, 玉の色コード, 台詞出力関数, 確率の分子, 等級) {
      this.#名前 = 名前;
      this.#玉の色名 = 玉の色名;
      this.#玉の色コード = 玉の色コード;
      this.#台詞出力関数 = 台詞出力関数;
      this.#確率の分子 = 確率の分子;
      this.#等級 = 等級;
    }

    陳列棚用出力(種類名) {
      return 福引の賞品.陳列棚用出力(this.#等級, 種類名 ?? this.#名前, this.#玉の色名, this.#玉の色コード);
    }

    抽選(抽選番号, 特賞取得関数) {
      if (this.ハズレ) {
        return { 出力: this.#出力() };
      }
      // 非当選
      if (this.#確率の分子 < 抽選番号) {
        return { 次の乱数: 抽選番号 - this.#確率の分子 };
      }
      const アイテム名 = this.#名前 ?? 特賞取得関数();
      return {
        出力: this.#出力()
          + (あなた.メンバー.装備または倉庫に送る(アイテム名, false) ? "はい。どうぞ！" : `${アイテム名}は、${あなた}さんの預かり所に送っておきますね`)
      }
    }

    get 玉の色名() { return this.#玉の色名; }
    get 玉の色コード() { return this.#玉の色コード; }
    get ハズレ() { return this.#確率の分子 === undefined; }

    static 陳列棚用出力(_等級, _名前, _玉の色名, _玉の色コード) {
      const
        等級 = document.createElement("span"),
        玉の色 = document.createElement("span");
      等級.style.color = 玉の色.style.color = _玉の色コード;
      等級.textContent = _等級;
      玉の色.textContent = `●${_玉の色名}`;
      return テーブル行出力([等級, 玉の色, _名前]);
    }

    #出力() {
      return this.#台詞出力関数(this.#名前, this.#等級);
    }

    #等級;
    #名前;
    #玉の色名;
    #玉の色コード;
    #台詞出力関数;
    #確率の分子;
  }

  class オーブの賞品 extends 福引の賞品 {
    constructor(色の名前, 色コード, 確率の分子) {
      super(`${色の名前}ｵｰﾌﾞ`, 色の名前, 色コード, 福引の台詞.特別なアタリ, 確率の分子);
    }

    陳列棚用出力() {
      return 福引の賞品.陳列棚用出力("１等", "オーブ", 空文字列, "gold");
    }
  }

  class 四等の賞品 extends 福引の賞品 {
    constructor(名前, 確率の分子) {
      super(名前, "桃", "#F3F", 福引の台詞.レア, 確率の分子, "４等");
    }

    陳列棚用出力() {
      return super.陳列棚用出力("種系");
    }
  }

  class モンスターじいさん extends 一般的な場所 {
    constructor() {
      super("farm.gif", 場所._訪問方法.いどう, new キャラクター("@ﾓﾝｼﾞｨ", "chr/013.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }
  }

  class フォトコン会場 extends 一般的な場所 {
    constructor() {
      super("none.gif", 場所._訪問方法.いどう, new キャラクター("@ﾜｺｰﾙ", "chr/018.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }
  }

  class オラクル屋 extends 販売店 {
    constructor() {
      super("goods.gif", 場所._訪問方法.いどう, new キャラクター("@ﾗｸﾙ", "chr/014.gif"),
        // TODO ${あなた}
        道具, 1, "どれを買うのだ？", undefined);
      this._こうどうリストリスト[0].こうどう追加(new かべがみ());
      this._こうどうリストリスト[0].こうどう追加(new こうどう(
        "やみいちば",
        () => { if (あなた.メンバー.転職回数 < /* TODO 15 */ 0) { return; } あなた.場所移動(場所.一覧("闇市場")); },
        こうどう.状態固定.get(こうどう.状態.隠しコマンド)
      ));
    }

    _NPCをしらべる() {
      super._NPCをしらべる(`${this._NPC.名前}「おっ？なんじゃなんじゃ？わしゃ何も知らんよ」`, "＠やみいちば に行きたい");
    }

    _品揃えアイテム名リストを取得() {
      return (あなた.メンバー.転職回数 > 15) ? [...アイテム.名前範囲("ﾋﾟﾝｸｽｶｰﾄ", "王族の衣装"), ...アイテム.名前範囲("ﾀｸｼｰﾄﾞ", "ﾓｼｬｽの巻物")]
        : [...アイテム.名前範囲("ﾋﾟﾝｸｽｶｰﾄ", "ﾀﾝｸﾄｯﾌﾟﾊﾝﾏｰ", あなた.メンバー.転職回数, "王族の衣装")];
    }

    _金欠時の通知内容を取得() { return `${あなた}よ…ゴールドが足らん`; }
    _装備時の会話内容を取得(アイテム) { return `${アイテム.名前}だな。ほい、どうぞ`; }
    _倉庫送信時の会話内容を取得(アイテム) { return `${アイテム.名前}は${あなた}の預かり所に送っておいたよん`; }

  }

  class 闇市場 extends 交換所 {
    constructor() {
      super("none.gif", 場所._訪問方法.特殊, new キャラクター("@闇商人", "chr/025.gif"),
        道具, 1, "どれと取引するんだ…？", "レアポイント不足だ…", "とりひき", [
        new 裏取引アイテム("時の砂", 1),
        new 裏取引アイテム("ﾌｧｲﾄ一発", 4),
        ...[...アイテム.範囲("ｼﾙﾊﾞｰｵｰﾌﾞ", "ﾊﾟｰﾌﾟﾙｵｰﾌﾞ")].map((アイテム) =>
          new 裏取引アイテム(アイテム.名前, 2)
        )
      ]);
      const ささげる = new こうどう("ささげる", this._ささげる.bind(this), undefined, this._ささげるクリック時.bind(this));
      this._こうどうリストリスト[0].こうどう追加(ささげる);
    }

    ヘッダー出力() {
      const 断片 = document.createDocumentFragment();
      断片.append(
        super._ヘッダー用出力(),
        強調テキスト("レアポイント ", あなた.メンバー._レアポイント.所持, "ポイント"),
        あなた.メンバー.ヘッダー用装備出力()
      );
      return 断片;
    }

    _はなす() {
      super._はなす(
        "よく来たな…。ここは闇市場だ…",
        "表の世界では手に入れられない物を取引している…",
        "物の取引は金では買えないもの…。つまり、魂…ｺﾞﾎｯｺﾞﾎｯ…ではなく、レアアイテムだ…",
        "お前の魂…ではなく、お前が装備しているレアアイテムをささげろ…",
        "レアアイテムをささげることによって…お前のレアポイントが増える…",
        "レアポイントにより取引できるアイテムが違う…"
      );
    }

    _NPCをしらべる() {
      super._NPCをしらべる("…お前の魂で取引したいのか？");
    }

    _ささげる(対象) {
      if (!対象) {
        this._ささげるクリック時();
        return;
      }
      if (!あなた.メンバー.が装備中(対象)) {
        通知欄.追加("ささげるものを装備して来い…");
        return;
      }
      if (!闇市場.#レアアイテム名一覧.has(対象)) {
        this.NPCに話させる(`…${対象}…か…。ダメだな…。そのアイテムは…めずらしくない…`);
        return;
      }
      あなた.メンバー._レアポイント.収支(1);
      this.NPCに話させる(`…${対象}…か…。レアだな…。いいだろう…。お前のレアポイントを加算しておこう…`);
      あなた.メンバー.装備アイテムを売る(対象, 0);
    }

    _ささげるクリック時() {
      const 出力 = あなた.メンバー.こうどう用装備出力("ささげる");
      通知欄.追加((出力.childElementCount === 0) ? "ささげるものを装備して来い…" : 出力);
    }

    _かう(対象) {
      super._かう(対象, あなた.メンバー._レアポイント);
    }

    static 初期化() {
      闇市場.#レアアイテム名一覧 = new Set([
        "隼の剣", "奇跡の剣", ...アイテム.名前範囲("ｶﾞｲｱの剣", "ﾊｸﾞﾚﾒﾀﾙの剣"),
        ...アイテム.名前範囲("神秘の鎧", "ﾊｸﾞﾚﾒﾀﾙの鎧"),
        "勇者の証", "邪神像", "ｼﾞｪﾉﾊﾞ細胞", ...アイテム.名前範囲("ﾌｧｲﾄ一発", "天空の盾と兜"), "時の砂", ...アイテム.名前範囲("次元のｶｹﾗ", "宝物庫の鍵"), "ｲﾝﾃﾘﾒｶﾞﾈ"
      ]);
    }

    _倉庫送信時の会話内容を取得(アイテム) { return `取引成立だ…。${アイテム.名前} はお前の預かり所に送っておいた…`; }

    static #レアアイテム名一覧;
    static #取引アイテム一覧;
  }

  class メダル王の城 extends 交換所 {
    constructor() {
      super("medal.gif", 場所._訪問方法.いどう, new キャラクター("@ﾒﾀﾞﾙ王", "chr/002.gif"),
        メダル王の賞品, 1, "どれと交換するんじゃ？", undefined, "こうかん", [
        new メダル王の賞品("戦士のﾊﾟｼﾞｬﾏ", 3),
        new メダル王の賞品("ｴﾙﾌの飲み薬", 5),
        new メダル王の賞品("不思議なﾎﾞﾚﾛ", 8),
        new メダル王の賞品("正義のｿﾛﾊﾞﾝ", 10),
        new メダル王の賞品("闇のﾛｻﾞﾘｵ", 15),
        new メダル王の賞品("ﾄﾞﾗｺﾞﾝの心", 20),
        new メダル王の賞品("ｷﾞｻﾞｰﾙの野菜", 25),
        new メダル王の賞品("ﾊｸﾞﾚﾒﾀﾙの心", 30),
        new メダル王の賞品("禁じられた果実", 35),
        new メダル王の賞品("奇跡の剣", 40),
        new メダル王の賞品("神秘の鎧", 45),
        new メダル王の賞品("ﾊｸﾞﾚﾒﾀﾙの鎧", 50),
        new メダル王の賞品("ｲﾝﾃﾘﾒｶﾞﾈ", 60),
        new メダル王の賞品("宝物庫の鍵", 77),
        new メダル王の賞品("天馬のたづな", 100)
      ]);
    }

    ヘッダー出力() {
      const 断片 = document.createDocumentFragment();
      断片.append(
        super._ヘッダー用出力(),
        強調テキスト("メダル ", あなた.メンバー._小さなメダル.所持, "枚")
      );
      return 断片;
    }

    _はなす() {
      super._はなす(
        "わしはメダル王じゃ、小さなメダルを集めておる",
        "小さなメダルを持ってきたら代わりに褒美をやろう",
        "世界中の小さなメダルはわしのもんじゃ！",
        "わしの夢は小さなメダルを山ほど集めてだな…ムニャムニャ…",
        "小さなメダルをよこさんかい！",
        "自分の家で小さなメダルを使うと、わしの所にメダルが届けられるのじゃ",
        "小さなメダルはモンスターの住処の奥深くにあるらしいのじゃ",
        `${あなた}からは小さなメダルを${あなた.メンバー._小さなメダル.所持}枚あずかっておるぞ`
      );
    }

    _かう(対象) {
      super._かう(対象, あなた.メンバー._小さなメダル);
    }

    _金欠時の通知内容を取得(取引アイテム) { return `小さなメダル${取引アイテム.名前}の賞品と交換するにはメダルが足りないぞ`; }
    _倉庫送信時の会話内容を取得(取引アイテム) { return `メダル${取引アイテム.名前}の賞品と交換するのじゃな！${取引アイテム.アイテム名}は${あなた}の預かり所に送っておいたぞ！`; }

    #賞品一覧;
  }

  class ダーマ神殿 extends 一般的な場所 {
    constructor() {
      super("job_change.gif", 場所._訪問方法.いどう, new キャラクター("@神官", "chr/016.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new こうどう("てんしょく", this._てんしょく.bind(this), undefined, this._てんしょくクリック時.bind(this))
      ));
    }

    _はなす() {
      super._はなす(
        "よくきた！このダーマ神殿ではお主の職業を変えることができるぞ",
        "ふむふむ。どの職業にしようかまよっているのじゃな",
        "転職をすると今のステータスが半分になってしまうぞ",
        "職業は重要じゃからよーく考えるのじゃよ",
        "転職アイテムを持っていれば、特別な職業に転職することができるぞ",
        `${あなた}は男前だから剣士なんかどうじゃろ？`,
        `${あなた}はお金が欲しいと思っているな？それなら商人になりなさい`,
        `${あなた}はモンスターと仲良くなりたいと思っているな？それなら魔物使いになりなさい`,
        `${あなた}は癒し系になりたいと思っているな？それなら僧侶になりなさい`,
        `${あなた}は相手やお宝が気になっているな？それなら盗賊になりなさい`,
        `${あなた}は誰かにイタズラしたいと思っているな？それなら遊び人になりなさい`,
        `${あなた}はモコモコしたものが好きじゃな？それなら羊飼いになりなさい`,
        `${あなた}は最終的に${転職可能な職業.ランダム取得().名前}を目指すと良いじゃろぉ`,
        `${あなた}に一番しっくりくるのは${転職可能な職業.ランダム取得().名前}じゃな`,
        "転職条件が厳しいからといって強いとは限らんぞ",
        "どんなにスキルを覚えても使いこなせなきゃ意味がないぞ",
        "スキルを早く覚えたい場合は早期転職をオススメしておる",
        "ステータスを上げたい場合は、成長率の高い職業を選び、なるべく遅く転職するのがコツじゃ",
        "今の職業のスキルを全てマスターしてから転職しても、おそくはないはずじゃ",
        `${あなた}の今の転職回数は…${あなた.メンバー.転職回数}回。ふむ、なかなかじゃのぉ`,
        "転職回数は冒険者の熟練度でもある。３回転職をすると初心者卒業レベルかのぉ",
        "転職回数は冒険者の熟練度でもある。10回以上の転職者は、この世界を熟知しているベテランじゃのぉ"
      );
    }

    ヘッダー出力() {
      const 断片 = document.createDocumentFragment();
      断片.append(
        super._ヘッダー用出力(),
        強調テキスト(`${あなた.メンバー.現職.名前} SP `, あなた.メンバー.現職.SP)
      );
      if (あなた.メンバー.前職 !== undefined) {
        断片.appendChild(強調テキスト(` / ${あなた.メンバー.前職.名前} SP `, あなた.メンバー.前職.SP));
      }
      断片.append(
        強調テキスト(" / Lv. ", あなた.メンバー.レベル),
        あなた.メンバー.ステータス.ヘッダー用基礎値出力()
      );
      if (あなた.メンバー._道具) {
        断片.appendChild(document.createTextNode(` / E：${あなた.メンバー._道具}`));
      }
      return 断片;
    }

    _NPCをしらべる() {
      super._NPCをしらべる(あなた.メンバー._実績.簡易出力());
    }

    _てんしょく(対象) {
      const _職業 = 転職可能な職業.一覧(対象, false);
      if (!_職業?.に転職できる(あなた.メンバー)) {
        this._てんしょくクリック時();
        return;
      }
      const アイテム名 = あなた.メンバー.転職(_職業);
      if (アイテム名 !== undefined) {
        this.NPCに話させる(`${アイテム名}を使いました！ `);
      }
      this.NPCに話させる(`${あなた}よ！${対象}となり新たな道を歩むが良い`);
    }

    _てんしょくクリック時() {
      通知欄.追加([
        `どの職業に転職するのじゃ？`,
        転職可能な職業.転職先候補出力(あなた.メンバー)
      ]);
    }
  }

  class 交流広場 extends 一般的な場所 {
    constructor() {
      super("park.gif", 場所._訪問方法.いどう, new キャラクター("@町娘", "chr/001.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null, new こうどう("うらない", this.うらない)));
    }

    _はなす() {
      super._はなす(
        `${あなた}さんこんにちわ`,
        "今日はいい天気ですね～",
        "夕方からはお天気が悪くなるみたいですよ",
        `今日の夕飯は何を作ろうかしら。${あなた}さんはどんな食べ物が好きですか？`,
        `あら、${あなた}さん♪今日も元気そうですね`,
        "これからどこに行くんですか？",
        `${あなた}さんを占ってあげましょう`,
        "私の占いって結構当たるらしいですよ",
        "趣味は占いです",
        `${あなた}さんの職業は${あなた.メンバー.現職.名前}ですね？どうですか？当たりですか？`
      );
    }

    _NPCをしらべる() {
      super._はなす([
        "何かお探しですか？",
        "メガネメガネ…",
        "はい！メガネ！",
        "お探し物はこれですか？-Ｏ-Ｏ-",
        "キャッ！何しているんですか！"
      ]);
    }

    うらない() {
      あなた.現在地.NPCに話させる(`今日の${あなた}さんの運勢はずばり…${ランダムな1要素([
        "大吉", "吉", "中吉", "末吉", "小吉", "凶", "大凶",
        "大吉", "吉", "中吉", "末吉", "小吉", "凶", "大凶",
        "ハッピー", "アンハッピー", "オッパピー", "残念", "頑張って", "愛があります", "開き直ってください", "何か起きます"
      ])}です♪ラッキーカラーは${ランダムな1要素([
        "黒", "白", "青", "赤", "空", "ピンク", "紫", "緑", "灰", "ブルー", "水", "肌", "オレンジ", "黄", "茶", "ワインレッド", "猫",
        "海", "土", "森", "藍", "杏子", "イチゴ", "オリーブ", "金", "銀", "パール"
      ])}色ですよ～。`);
    }
  }

  class オークション会場 extends 一般的な場所 {
    constructor() {
      super("auction.gif", 場所._訪問方法.いどう, new キャラクター("@ﾜｲﾙﾄﾞ", "chr/012.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }
  }

  class イベント広場 extends 一般的な場所 {
    constructor() {
      super("event.gif", 場所._訪問方法.いどう);
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }

    メイン(ログインメンバー, チャットリスト) {
      // TODO タイミングが若干微妙
      this.#人数を読み込んで背景と販売アイテムを切り替え(ログインメンバー.size);
      super.メイン(ログインメンバー, チャットリスト);
    }

    _NPCをしらべる() {
      super._NPCをしらべる("なんと、薬草を見つけた！…が人の物を盗ってはいけない…");
    }

    _はなす() {
      if (this.#イベント開催中()) {
        super._はなす(
          "おや、たくさんの人が集まって何かあるんですか？",
          "バザーでもやるんですかねぇ",
          "たくさん人がいて、にぎやかですね",
          "では、商売でもさせてもらいましょうか"
        );
      }
      else {
        super._はなす();
      }
    }

    #人数を読み込んで背景と販売アイテムを切り替え(人数) {
      this.#人数 = 人数;
      if (!this.#イベント開催中()) {
        this._NPC = undefined;
        return;
      }
      this._NPC = new キャラクター("@旅の商人", "chr/024.gif");
      this._背景画像 = `event${(this.#人数 < 20) ? 1 : (this.#人数 < 30) ? 2 : 3}.gif`;
    }

    #イベント開催中() {
      return this.#人数 >= 10;
    }

    #人数; // 商人を除く
  }

  class 願いの泉 extends 一般的な場所 {
    constructor() {
      super("sp_change.gif", 場所._訪問方法.いどう, new キャラクター("@女神", "chr/011.gif")); this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new こうどう("ＨＰ", (SP文字列) => { this.#ささげる(SP文字列, 簡易ステータス.ＨＰ(2)); }),
        new こうどう("ＭＰ", (SP文字列) => { this.#ささげる(SP文字列, 簡易ステータス.ＭＰ(2)); }),
        new こうどう("攻撃力", (SP文字列) => { this.#ささげる(SP文字列, 簡易ステータス.攻撃力(1)); }),
        new こうどう("守備力", (SP文字列) => { this.#ささげる(SP文字列, 簡易ステータス.守備力(1)); }),
        new こうどう("素早さ", (SP文字列) => { this.#ささげる(SP文字列, 簡易ステータス.素早さ(1)); })
      ));

    }

    ヘッダー出力() {
      const 断片 = document.createDocumentFragment();
      断片.append(
        super._ヘッダー用出力(),
        `$jobs[$m{job}][1] $e2j{sp}<b>$m{sp}</b>|;
      for my $k (qw/lv mＨＰ mＭＰ at df ag/) {
        print qq| $e2j{$k}<b>$m{$k}</b>|;
      }
      `);
      return 断片;
    }

    _はなす() {
      super._はなす(
        "スキルポイントはレベルが上がるごとに１ポイント増えていくのです",
        "スキルポイントを早く上げるコツは、何度も同じ職業に転職することです",
        "$mのスキルポイントは現在 $m{sp} ポイントです",
        "スキル習得を目指している場合は、ささげずにとっておくのですよ",
        "スキルポイントをささげるのです",
        "スキルポイントのお礼に、$mのステータスを上げてあげましょう",
        "一度ささげたスキルポイントを戻すことはできません",
        "スキルポイントは、その職業のスキルを習得するのに必要です"
      );
    }

    #ささげる(SP文字列, 増加ステータス) {
      const SP = parseInt(SP文字列);
      // TODO 数値への変換がデフォと違うかも
      if (復活の祭壇.#整数でない文字列か.test(SP文字列) || SP < 1) {
        this._クリック時効果()
        return;
      }
      if (!あなた.現職.SP増減(-SP)) {
        通知欄.追加("ささげるSPが足りません");
        return;
      }
      あなた._ステータス.成長(増加ステータス);
      this.NPCに話させる(`SP ${SP} のかわりに $e2j{$k} を $v あたえましょう`);
    }

    static _クリック時効果() {
      通知欄.追加("SPをいくつささげますか？例＞『＠ＨＰ>1』SPを１ささげＨＰを上げる");
    }

    static #整数でない文字列か = new RegExp(/[^0-9]/);
  }

  class 復活の祭壇 extends 一般的な場所 {
    constructor() {
      super("reborn.gif", 場所._訪問方法.いどう, new キャラクター("@巫女", "chr/050.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }
  }

  class ギルド協会 extends 一般的な場所 {
    constructor() {
      super("join_guild.gif", 場所._訪問方法.いどう, new キャラクター("@支配人", "chr/007.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        // TODO 改名
        new ちゅうもん()
      ));
    }

    _はなす() {
      super._はなす(
        "$auto_delete_guild_day 日以上「＠ぎるど」による出入りがない場合は、自動的に削除となります",
        "ギルドとは、気が合うメンバーの集まりです",
        "ギルド名は、途中で変えることができませんので、じっくり考えてください",
        "ギルマスとは、ギルドマスターの略称です。そのギルド内で一番の権限があります",
        "ギルマスは、メンバーに役職名をあたえることができるのです",
        "ギルドマークや壁紙は、お金がかかりますが何度でも変えることが可能です",
        "ギルド参加者は、ギルド戦ができるようになります",
        `ギルドを新しく作るには、${ギルド協会.#ギルド設立手数料} G必要です`,
        `ギルドマークを変更するには、${ギルド協会.#ギルドマーク変更手数料} G必要です`,
        "ギルド戦で優勝すると勝利メダルがギルド内に飾られていきます"
      );
    }

    static #ギルド設立手数料 = 3000;
    static #ギルドマーク変更手数料 = 3000;
    static #最大ギルド名文字数 = 16;
  }

  class 命名の館 extends 一般的な場所 {
    constructor() {
      super("name_change.gif", 場所._訪問方法.いどう, new キャラクター("@ﾏﾘﾅﾝ", "chr/017.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }

    #性転換(性別) {
      if (this.#性転換チェック(性別)) {
        return;
      }
      this.NPCに話させる(`${あなた.メンバー.性別}をやめて${性別}として生きていくのだな。それでは…カッ！！<br />${あなた}は今から女としての人生の始まりじゃ`);
      あなた.軌跡に書き込み(`${あなた.メンバー.性別}をやめて${性別}として生まれ変わる`);
      あなた.メンバー.性別 = 性別;
      あなた.メンバー.アイコンをリセット();
      あなた.メンバー.所持金.収支(- 命名の館.#性転換手数料);
    }

    #性転換チェック(性別) {
      try {
        if (あなた.メンバー.性別 === 性別)
          throw `${this._NPC.名前}「すでに${あなた}は${性別}じゃぞ」`;
        if (あなた.メンバー.所持金.所持 < 命名の館.#名前変更手数料)
          throw `${this._NPC.名前}「${性別}に性転換するためのお金が足りぬぞ」`;
        if (あなた.メンバー.現職.性別 !== 性別)
          throw `${this._NPC.名前}「職業が ${あなた.メンバー.現職} は性転換することはできぬぞ」`;
      }
      catch (エラー) {
        通知欄.追加(エラー);
        return true;
      }
      return false;
    }

    static #名前変更手数料 = 500_000;
    static #性転換手数料 = 10_000;
  }

  class 追放騎士団 extends 一般的な場所 {
    constructor() {
      super("exile.gif", 場所._訪問方法.いどう, new キャラクター("@追放騎士", "chr/015.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }

    ヘッダー出力() {
      const 出力 = super.ヘッダー出力("荒らし追放騎士団");
      return 出力;
    }

    _はなす() {
      super._はなす(
        "ここは荒らし追放騎士団！荒らしや不正プレイヤーを取り締まっている！",
        "荒らしや不正プレイヤーなどを追放して、楽しい環境を作ろう！",
        "荒らしを見かけたらここで追放投票をしてくれ！荒らしのいない楽しい環境はお前達がつくっていくのだ。",
        "荒らしの発言に対して反応してはいけない。相手の反応を楽しむのが荒らしなのだ。無視が一番効果的だ。",
        "荒らしの不快な言葉に不快な言葉で返してしまうのは、荒らしと一緒に荒らしているのと同じことだ。",
        "感情的になっているときは、クールになれ！冷静な時こそ正しい判断をすることができるはずだ。",
        "なんとなくムカつくなどの感情的な判断で誤った追放申請をした場合、申請者が逆に罰を受けることになるぞ。",
        `判決に必要な票数は${追放申請の必要票数}票必要だ！`,
        "投票できるのは、転職回数が１回以上のプレイヤーのみだ！"
      );
    }

    _ついほう(対象) {
      const [プレイヤー名, 理由] = 対象.split("＠りゆう&gt;");
      if (this.#追放チェック(プレイヤー名))
        return;
      データベース操作.追放申請読み込み();
      this.NPCに話させる(`<span class="damage">${プレイヤー名}を追放者リストに追加しておいたぞ。判決がくだるのを待て！</span>`);
      ニュース.書き込み(`<span class="damage">${あなた}が${プレイヤー名}を${理由}の理由で追放申請しました</span>`);
    }

    #追放チェック(プレイヤー名, 理由) {
      try {
        if (プレイヤー名 === 空文字列 || 理由 === 空文字列)
          throw "『＠ついほう>○○○＠りゆう>△△△』○○○には荒らしの名前、△△△にはなぜ追放したいのかの理由を書いてくれ";
        if (あなた.メンバー.転職回数 < 1)
          throw "未転職の方は、申請することはできません";
        if (プレイヤー名 === あなた.toString())
          throw "自分自身を申請することはできません";
      }
      catch (エラー) {
        通知欄.追加(エラー);
        return true;
      }
      return false;
    }

    #投票(プレイヤー, 賛成する) {

    }

    static #却下プレイヤー拘束日数 = 25;
    static #申請取り消し禁止秒数 = 60 * 60 * 3;
  }

  class 追放申請 {
    constructor(申請者名, 被疑者名, 理由, 賛成者名リスト = [申請者名], 反対者名リスト = 空配列) {
      this._申請者名 = 申請者名;
      this._被疑者名 = 被疑者名;
      this._理由 = 理由;
      this._賛成者名リスト = new Set(賛成者名リスト);
      this._反対者名リスト = new Set(反対者名リスト);
    }

    async 新規登録() {
      if (await this.新規登録チェック()) {
        return false;
      }
      データベース操作.追放申請を保存(this);
      return true;
    }

    async 新規登録チェック() {
      try {
        if (!await メンバー.プレイヤーが存在(this._被疑者名))
          throw `${被疑者名}というプレイヤーは存在しません`;
        if (await データベース操作.追放申請を読み込み(this._被疑者名))
          throw `${被疑者名}はすでに追放申請されています`;
        if (await データベース操作.プレイヤーの追放申請提出数を取得() >= 追放申請数個人上限)
          throw "申請した追放者の判決を待ってください";
      }
      catch (エラー) {
        通知欄.追加(エラー);
        return true;
      }
      return false;
    }

    一覧用出力() {
      const
        断片 = document.createDocumentFragment(),
        賛成票数 = 強調テキスト("賛成 ", this._賛成者名リスト.length),
        反対票数 = 強調テキスト("反対 ", this._反対者名リスト.length);
      断片.append(
        document.createElement("hr"),
        `申請：${this.名前} / 追放：${this._被疑者} / 理由：${this._理由}`,
        document.createElement("br"),
        賛成票数, ` 票：${this._賛成者名リスト.join(",")}　`,
        反対票数, ` 票：${this._反対者名リスト.join(",")}`,
        document.createElement("br")
      );
      チャットフォーム.文字列追加イベントを登録(賛成票数, `＠さんせい>${this._被疑者} `);
      チャットフォーム.文字列追加イベントを登録(反対票数, `＠はんたい>${this._被疑者} `);
      return 断片;
    }

    投票(投票者名, 賛成する) {
      if (投票者名 === this._申請者名 && 賛成する === false) {
        this.取り消す();
        ニュース.書き込み(`<span class="revive">${投票者名}が${this._被疑者名}の追放申請を取り消しました</span>`);
        return;
      }
      if (this._賛成者名リスト.has(投票者名) || this._反対者名リスト.has(投票者名))
        throw "すでに追放投票に参加しています";
      if (投票者名 === this._被疑者名)
        throw "申請されている人は投票することはできません";
      const リスト = (賛成する ? this._賛成者名リスト : this._反対者名リスト);
      if (リスト.size < 追放申請の必要票数 - 1) {
        リスト.add(投票者名);
        データベース操作.追放申請を保存(this);
        // デフォルトを忠実に再現
        あなた.現在地.NPCに話させる(`${this._被疑者名}の追放${(賛成する ? "：" : "の")}${this.#票数()}`);
        return;
      }
      this.#議決(賛成する);
    }

    取り消す() {
      // TODO 投票後は一定時間の取り消し制限
      データベース操作.追放申請を削除(this._被疑者名);
    }

    #議決(有罪) {
      const
        議決内容 = `【議決】${this.#票数()}。よって ${this._被疑者名}は${有罪 ? "有" : "無"}罪`,
        ニュース内容 = document.createElement("span"),
        ニュース外枠 = document.createElement("div"),
        NPCの話す内容 = [];
      ニュース内容.classList.add(有罪 ? "die" : "revive");
      ニュース内容.textContent = 議決内容 + (有罪 ? "として追放されました" : "となりました");
      ニュース外枠.appendChild(ニュース内容);
      ニュース.書き込み(ニュース外枠.innerHTML);
      ニュース内容.textContent = 議決内容 + (有罪 ? "！追放とする！以上！" : "！");
      NPCの話す内容.push(ニュース外枠.innerHTML);
      if (!有罪) {
        if (this._申請者名 && /^[^@]/.test(this._申請者名)) {
          const 眠りの刑 = `申請者の${this._申請者名}は $penalty_day日間の眠りの刑`;
          ニュース内容.classList.replace("revive", "die");
          ニュース内容.textContent = 眠りの刑 + "となりました";
          ニュース.書き込み(ニュース外枠.innerHTML);
          ニュース内容.textContent = 眠りの刑 + "とする！";
          NPCの話す内容.push(ニュース外枠.innerHTML);
          メンバー.データベースから読み込む(this._被疑者名, this.#睡眠追加);
        }
        NPCの話す内容.push("以上！");
      }
      あなた.現在地.NPCに話させる(NPCの話す内容.join(空文字列));
      データベース操作.追放申請を削除(this._被疑者名);
      if (有罪) {
        // TODO ブラックリストに追加
        // TODO 下の行多分エラーの元
        データベース操作.プレイヤーを削除(this._被疑者名);
      }
    }

    #票数() {
      return `賛成 ${this._賛成者名リスト.size} 票 / 反対 ${this._賛成者名リスト.size} 票`;
    }

    #睡眠追加(要求) {
      const 申請者 = new メンバー(要求.target.result);
      申請者.睡眠(60 * 60 * 24 * 追放申請が却下されたプレイヤーの拘束日数, true);
      データベース操作.プレイヤーを保存(申請者);
    }

    関係者(プレイヤー名) {
      return this._申請者名 === 申請者名
        || this._被疑者名 === プレイヤー名
        || this._賛成者名リスト.has(プレイヤー名)
        || this._反対者名リスト.has(プレイヤー名);
    }

    static 関係者(プレイヤー名) {
    }

    static オブジェクトから({ _申請者名, _被疑者名, _理由, _賛成者名リスト, _反対者名リスト }) {
      new 追放申請(_申請者名, _被疑者名, _理由, _賛成者名リスト, _反対者名リスト);
    }
  }

  class 何でも屋 extends 一般的な場所 {
    constructor() {
      super("helper.gif", 場所._訪問方法.いどう, new キャラクター("@ﾘｯｶ", "chr/036.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new こうどう("みる", this._みる.bind(this)),
        new こうどう("かいけつ", this._かいけつ.bind(this))
      ));
    }

    ヘッダー出力() {
      return super.ヘッダー出力("手助けクエスト");
    }

    _はなす() {
      super._はなす(
        "ここは困っている人達を助ける何でも屋よ",
        "アイテムやモンスターを依頼主の代わりに探してきてほしいの",
        "報酬は錬金に必要となる素材など、他では手に入らないアイテムよ",
        "たまにレアクエストといって、条件を満たすのが難しい依頼がくるの。でも、その時の報酬は他では手に入れることができないものよ",
        "誰も解決することができない依頼はしばらくすると違う依頼に変わるわ"
      );
    }

    _みる() {
      通知欄.追加("手助けクエスト一覧");
      データベース操作.何でも屋の依頼を読み込む(this.#みる.bind(this));
    }

    #みる(データベースイベント) {
      const 依頼リスト = データベースイベント.target.result.map(何でも屋の依頼.オブジェクトから);
      通知欄.追加(何でも屋の依頼.陳列棚出力(依頼リスト, true));
    }

    _かいけつ(依頼名) {
      const リクエスト = new 依頼解決のリクエスト(依頼名);
      データベース操作.何でも屋の依頼を読み込む(リクエスト.解決.bind(リクエスト));
      throw "非同期処理";
    }
  }

  class 依頼解決のリクエスト {
    constructor(依頼名) {
      this.#依頼名 = 依頼名;
    }

    解決(データベースイベント) {
      const 依頼リスト = データベースイベント.target.result.map(何でも屋の依頼.オブジェクトから);
      // デフォルトに忠実
      let 喋った = false;
      const
        解決したい依頼 = 依頼リスト.find(this.#解決したい依頼か, this),
        解決内容 = 解決したい依頼?.解決();
      // デフォルト再現: 解決したい依頼があったが解決できなかった時は依頼を更新しない
      if (解決したい依頼 !== undefined && 解決内容 === undefined) {
        return;
      }
      for (const 依頼 of 依頼リスト) {
        if (依頼 === 解決したい依頼) {
          if (解決内容 !== undefined) {
            this.NPCに話させる(解決内容);
            喋った = true;
          }
          continue;
        }
        const 話す内容 = 依頼.期限切れなら更新();
        if (話す内容 !== undefined) {
          あなた.現在地.NPCに話させる(話す内容);
          喋った = true;
        }
      }
      if (!喋った) {
        通知欄.追加("手助けクエスト一覧");
        通知欄.追加(何でも屋の依頼.陳列棚出力(依頼リスト, false));
      }
      あなた.予約チャットを書き込んでから読み込む();
    }

    #解決したい依頼か(依頼名) {
      return 依頼名 === this.#依頼名;
    }

    #依頼名;
  }

  class 錬金場 extends 一般的な場所 {
    constructor() {
      super("alchemy.gif", 場所._訪問方法.いどう, new キャラクター("@ﾄﾛﾃﾞ", "chr/038.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }

    メイン(...args) {
      this.#完成確認();
      super.メイン(...args);
    }

    _はなす() {
      super._はなす(
        "２つのアイテムを錬金することで新たなアイテムを作ることができるぞい",
        "錬金ﾚｼﾋﾟを使うことで錬金することが可能になるぞい",
        "錬金したアイテムの完成は、お主が寝て起きた次の日には完成しているじゃろう",
        "錬金で作ることでしか手に入らない武器や防具があるそうじゃ・・・",
        "錬金ﾚｼﾋﾟは習得済み以外のものを習得することができるぞい"
      );
    }

    _NPCをしらべる() {
      super._NPCをしらべる(`${this._NPC.名前}「いやん。どこをさわっとるんじゃっ！`);
    }

    #完成確認() {
      const レシピ = あなた.メンバー.錬金を受け取る();
      if (レシピ === undefined) {
        return;
      }
      チャットフォーム.内容 = "＠れんきんでかんせいしたものをうけとる";
      this.NPCに話させる(`まっておったぞ！${レシピ.素材名1}と${レシピ.素材名2}を錬金した <b>${レシピ.完成品名}</b> が完成したぞい！出来上がったアイテムは預かり所の方に送っておいたぞい！`);
    }
  }

  class 天界 extends 一般的な場所 {
    constructor() {
      super("god.gif", 場所._訪問方法.特殊, new キャラクター("@神", "chr/052.gif"));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new ちゅうもん()
      ));
    }

    ヘッダー出力() {
      return this._ヘッダー用出力(undefined, false);
    }

    _NPCをしらべる() {
      通知欄.追加(`${this._NPC.名前}「本当の願いは自分の力で叶えるのだ…」`, "＠ねがう>メイドを雇いたい");
    }

    _はなす() {
      super._はなす(`${あなた}よ。よくぞここまできた。${あなた}の願いを一つだけ叶えてやろう`);
    }
  }

  class 町 extends 一般的な場所 {
    constructor(名前, 背景画像, 最大建築数, 家のアイコンリスト, 家の値段, 家の所有日数) {
      super(背景画像, 場所._訪問方法.まち);
      this._名前 = 名前;
      this.#最大建築数 = 最大建築数;
      // .gif 抜き
      this.#家のアイコンリスト = 家のアイコンリスト;
      this.#家の値段 = 家の値段;
      this.#家の所有日数 = 家の所有日数;
      this._こうどうリストリスト.unshift(new こうどうマネージャー(null,
        new こうどう("たてる", this._たてる.bind(this), undefined, this._たてる家の候補を表示.bind(this)),
        new こうどう("ちぇっく", this._ちぇっく.bind(this), undefined, this._ちぇっく説明)
      ));
    }

    _たてる(家のアイコン) {
      if (!this.#家のアイコンリスト.has(家のアイコン)) {
        this._たてる家の候補を表示();
        return;
      }
      if (this.#建設チェック()) {
        return;
      }
      const 期限 = 更新日時.取得() + this.#家の所有日数 * 24 * 60 * 60;
      this.NPCに話させる(`${あなた} の家を建てました！家の所有期間は ${更新日時.月日時タイムスタンプ文字列(期限)} までです`);
      あなた.メンバー.所持金.収支(-this.#家の値段);
      あなた.メンバー._ギルド?.ポイント獲得(this.#家の所有日数);
      データベース操作.場所別キャラクターの登録または更新(
        this.名前, new キャラクター(this.#家の名前(あなた), this.#家のアイコン(家のアイコン), undefined, 期限)
      );
    }

    _たてる家の候補を表示() {
      通知欄.追加([
        `${this._ヘッダー用出力()}家の値段 ${this.#家の値段} G / 最大建設数 ${this.#最大建築数} 軒 / 所有日数 ${this.#家の所有日数} 日`,
        "どの家を建てますか？",
        空文字列
      ]);
      for (const 家のアイコン名 of this.#家のアイコンリスト) {
        const img = document.createElement("img");
        img.src = `resource/icon/${this.#家のアイコン(家のアイコン名)}`;
        通知欄.追加(img, `＠たてる>${家のアイコン名} `);
      }
    }

    _ちぇっく(対象) {
      対象 += " の家";
      const 対象のキャラクター = this._名前からキャラクター取得(対象);
      if (!対象のキャラクター) {
        this._ちぇっく説明();
        return;
      }
      this.NPCに話させる(`<b>${対象}</b>の所有期間は ${更新日時.月日時タイムスタンプ文字列(対象のキャラクター.最終更新日時)} までです`);
    }

    _ちぇっく説明() {
      通知欄.追加(`＠ちぇっく>○○○ の家で、その家の所有期間を調べることができます`, "＠ちぇっく");
    }

    #建設チェック() {
      try {
        if (あなた.メンバー.所持金.所持 < this.#家の値段)
          throw "家を建てるお金が足りません";
        let 建設数 = 0;
        for (const キャラクター of this._キャラクターリスト) {
          // デフォルトに忠実
          if (キャラクター.はNPC色() && ++建設数 >= this.#最大建築数)
            throw [
              `${this.名前} には 最大 ${this.#最大建築数} 軒までしか建てることができません`,
              "家がなくなるまでしばらくお待ちください"
            ];
        }
        // TODO デフォルトだとほかの町もチェックしている(理想の実装的にはユーザーデータ側に家の期限を持つべきだと思われる)
        if (this._名前からキャラクター取得(this.#家の名前(あなた)) !== undefined)
          throw `${あなた} はすでに家を持っています`;
      }
      catch (エラー) {
        通知欄.追加(エラー);
        return true;
      }
      return false;
    }

    #家の名前(メンバー名) {
      return `${メンバー名} の家`;
    }

    #家のアイコン(家のアイコン名) {
      return `house/${家のアイコン名}.gif`;
    }

    #最大建築数;
    #家のアイコンリスト;
    #家の値段;
    #家の所有日数;
  }

  class 家 extends 一般的な場所 {
    constructor(所有者名, 所有者ID) {
      super("../space.gif", 場所._訪問方法.特殊);
      this.#所有者名 = 所有者名;
      this.#所有者ID = 所有者ID;
      console.trace(this.#所有者ID);
      this._こうどうリストリスト.unshift(new こうどうマネージャー(() => this.は自分の家() && !あなた.メンバー.は睡眠中(),
        new アイテムをつかう(),
        new こうどう("てがみをかく", あなた.手紙を送る.bind(あなた)),
        new こうどう("てがみをよむ", あなた.受け取った手紙を見る.bind(あなた)),
        new こうどう("からー", this._からー.bind(this), undefined, this._色一覧を表示.bind(this)),
        new こうどう("ことばをおしえる", this._ことばをおしえる.bind(this), undefined, this._ことばをおしえる.bind(this))
      ));
      this._こうどうリストリスト.unshift(new こうどうマネージャー(() => this.は自分の家() && !あなた.メンバー.は睡眠中(),
        new こうどう("ねる", () => {
          // TODO ログイン人数に応じて睡眠時間増加
          あなた.チャット書き込み予約(`${あなた}はベッドにもぐりこんだ！`);
          あなた.メンバー.睡眠(睡眠秒数);
          あなた.メンバー.錬金を完成させる();
        }),
        new こうどう("あいてむずかん", () => {
          あなた.チャット書き込み停止();
          $id("アイテム図鑑-プレイヤー名").textContent = this.#所有者名;
          // TODO バグに注意
          if (this.は自分の家() && 0)
            あなた.メンバー.コンプリート確認();
          データベース操作.アイテム図鑑を読み込む(this.#所有者ID, 画面.一覧("アイテム図鑑").読み込み);
        }),
        new こうどう("もんすたーぶっく", () => {
          あなた.チャット書き込み停止();
          $id("モンスターブック-プレイヤー名1").textContent = $id("モンスターブック-プレイヤー名2").textContent = this.#所有者名;
          画面.一覧("モンスターブック").表示(this.#所有者ID);
          throw "モンスター図鑑表示";
        }),
        new こうどう("じょぶますたー", () => {
          あなた.チャット書き込み停止();
          $id("ジョブマスター-プレイヤー名").textContent = this.#所有者名;
          データベース操作.ジョブマスターを読み込む(this.#所有者ID, 画面.一覧("ジョブマスター").読み込み);
          throw "じょぶますたー表示";
        }),
        new こうどう("ぷろふぃーる", () => {
          あなた.チャット書き込み停止();
          プロフィール画面.名前を設定(this.#所有者名);
          const _プロフィール画面 = 画面.一覧("プロフィール");
          データベース操作.プロフィールを読み込む(
            this.#所有者ID,
            this.は自分の家() ? _プロフィール画面.入力画面読み込み : _プロフィール画面.表示画面読み込み
          );
          throw "ぷろふぃーる表示";
        }),
      ));
      家.#一覧.set(this.#所有者名, this);
    }

    更新要求() {
      // TODO 削除or改名プレイヤーの家の場合、自分の家に送還
      super.更新要求();
    }

    ヘッダー出力() {
      if (あなた.メンバー.は睡眠中()) {
        return this.#睡眠時用ヘッダー出力();
      }
      const 場所名 = this._家の名前を取得();
      if (!this.は自分の家()) {
        return this._ヘッダー用出力(場所名, false);
      }
      // TODO ○○が届いています home.cgi 40行目
      const 断片 = document.createDocumentFragment();
      断片.appendChild(this._ヘッダー用出力(場所名));
      断片.appendChild(強調テキスト(
        "Lv.", あなた.メンバー._レベル,
        " / 経験値", あなた.メンバー._経験値,
        "Exp / 次のLv.", あなた.メンバー._レベル * あなた.メンバー._レベル * 10,
        "Exp / 転職回数", あなた.メンバー.転職回数,
        "回 / ゴールド", あなた.メンバー.所持金.所持,
        "G / 疲労度", あなた.メンバー._疲労, "％"
      ));
      // TODO
      if (あなた.メンバー._武器) {
        `<span onclick="text_set('＠つかう>${あなた.メンバー._武器} ')"> / E：${あなた.メンバー._武器}</span>`
      }
      if (あなた.メンバー._防具) {
        `<span onclick="text_set('＠つかう>${あなた.メンバー._防具} ')"> / E：${あなた.メンバー._防具}</span>`
      }
      if (あなた.メンバー._道具) {
        `<span onclick="text_set('＠つかう>${あなた.メンバー._道具} ')"> / E：${あなた.メンバー._道具}</span>`
      }
      return 断片;
    }

    は自分の家() {
      return this.#所有者名 = あなた.名前;
    }

    static 一覧(メンバー名, コールバック, あなたの名前, あなたのID, エラーを出す = true) {
      if (this.#一覧.has(メンバー名)) {
        コールバック(this.#一覧.get(メンバー名));
        return;
      }
      if (あなたのID) {
        コールバック(new 家(あなたの名前, あなたのID));
        return;
      }
      if (メンバー名 === あなた.名前) {
        コールバック(あなた.メンバー.家を取得());
        return;
      }
      // TODO ログインメンバー一覧からの検索？
      // TODO 非同期
      データベース操作.プレイヤーを読み込む(メンバー名, (データベースイベント) => {
        const 結果 = データベースイベント.target.result;
        if (結果 === undefined) {
          if (エラーを出す) {
            エラー.表示(`${メンバー名}という家は見つかりません`);
          }
          else {
            コールバック(this.#一覧.get(あなた.名前));
          }
          return;
        }
        const _家 = new メンバー(結果).家を取得();
        家.#一覧.set(メンバー名, _家);
        コールバック(_家);
      });
    }

    get 所有者名() { return this.#所有者名; }
    get ログ名() { return this.#所有者ID; }


    static 削除(メンバー名) {
      家.#一覧.delete(メンバー名);
      // TODO ログの削除
    }

    _はなす() {
      if (this._キャラクターリスト.size <= 1) {
        通知欄.追加("しかし、誰もいなかった…");
        return;
      }
      データベース操作.話す言葉を取得(this.#所有者ID, (データベースイベント) => {
        const 言葉リスト = データベースイベント.target.result;
        if (言葉リスト.length === 0)
          return;
        super._はなす(...言葉リスト);
        あなた.予約チャットを書き込んでから読み込む();
      });
      throw "非同期処理";
    }

    _ことばをおしえる(言葉) {
      if (!言葉) {
        通知欄.追加("＠ことばをおしえる>○○○ で家にいるモンスターが＠はなすで話すようになります", "＠ことばをおしえる> ");
        return;
      }
      if (this._キャラクターリスト.size <= 1) {
        通知欄.追加("教える相手がいません");
        return;
      }
      if (全角を2とした文字列長(言葉) > 教える言葉の最大文字数) {
        通知欄.追加(`言葉が長すぎます(半角${教える言葉の最大文字数}文字まで)`);
        return;
      }
      this.NPCに話させる(言葉);
      データベース操作.言葉を教える(あなた.メンバー._ID, 言葉);
    }

    _からー(色コード) {
      const _色コード = あなた.メンバー.色を変更(色コード);
      if (色コード === undefined) {
        this._色一覧を表示();
        return;
      }
      あなた.チャット書き込み予約(`カラーを<span style="color: ${_色コード}">${_色コード}</span>に変更しました`);
    }

    _色一覧を表示() {
      通知欄.追加(["#から始まる(16進数の)カラーコードを記入してください", "サンプル＞"]);
      for (const [色コード, 色名] of サンプル色リスト) {
        const span = document.createElement("span");
        span.style.color = 色コード;
        span.textContent = 色名;
        通知欄.追加(span, `＠からー>${色コード} `);
        通知欄.追加(" ");
      }
    }

    _家の名前を取得() {
      return `${this.#所有者名}の家`;
    }

    get _NPC() {
      // TODO
      console.log(1);
      const キャラクター配列 = Array.from(this._キャラクターリスト);
      const NPC候補 = ランダムな1要素(キャラクター配列);
      return NPC候補.はNPC色() ? NPC候補 : キャラクター配列[0];
    }

    #睡眠時用ヘッダー出力() {
      const 場所名 = this._家の名前を取得();
      // TODO デフォルトに忠実に: 寝た瞬間に残り時間が表示されないようにする
      if (あなた.メンバー.予定時刻を過ぎているなら起床する()) {
        画面.一覧("ゲーム画面").睡眠時用ログアウトボタンを表示(false);
        return document.createTextNode(`【${場所名}】 ${あなた}のＨＰＭＰ疲労が回復した！`);
      }
      const 断片 = document.createDocumentFragment();
      const _睡眠タイマー = 睡眠タイマー.作成(あなた.メンバー.残り睡眠秒数);
      画面.一覧("ゲーム画面").睡眠時用ログアウトボタンを表示();
      断片.appendChild(document.createTextNode(`【${場所名}】 お休み中「Zzz...」 目覚めるまで `));
      断片.appendChild(_睡眠タイマー);
      return 断片;
    }

    // TODO 寝た瞬間はメンバーが表示されないのを修正

    #所有者名;
    #所有者ID;

    static #一覧 = new Map();
  }

  class チャット欄 {
    更新(チャットリスト) {
      this.#チャットリスト = チャットリスト;
    }

    出力() {
      const 断片 = document.createDocumentFragment();
      for (const チャット of this.#チャットリスト) {
        if (!チャット.表示する()) {
          continue;
        }
        断片.appendChild(チャット.出力());
      }
      return 断片;
    }

    /*
    チャットを追加(追加チャットリスト) {
      for (const チャット of 追加チャットリスト) {
        if (this.#チャットリスト.length >= 最大ログ保存件数) {
          const 要素 = this.#チャット要素リスト.shift();
          this.#要素.removeChild(要素);
          this.#チャットリスト.shift();
        }
        const 要素 = チャット.出力();
        this.#チャットリスト.push(チャット);
        this.#チャット要素リスト.push(要素);
        this.#要素.appendChild(要素);
      }
    }
    */
    #チャットリスト;
  }

  class チャット {
    constructor(発言者, 発言者の色, 内容, 日時, 宛て先) {
      this._発言者 = 発言者;
      this._発言者の色 = 発言者の色;
      this._内容 = Array.isArray(内容) ? 内容 : [内容];
      this._日時 = 日時;
      this._宛て先 = 宛て先;
    }

    内容追加(内容, 宛て先) {
      this._内容.push(内容);
      if (宛て先) {
        this._宛て先 = 宛て先;
      }
    }

    表示する() {
      return this._宛て先 === undefined || this._発言者 === あなた.名前 || this._宛て先 === あなた.名前;
    }

    出力() {
      return チャット.出力(this);
    }

    static 出力(チャット) {
      const
        断片 = document.createElement("div"),
        span = document.createElement("span"),
        hr = document.createElement("hr");
      span.classList.add("チャット");
      span.innerHTML = チャット._宛て先
        ? `<span class="ささやき">${チャット._発言者}： ${チャット._内容.join(空文字列)} <span class="チャット日時">(${更新日時.タイムスタンプ文字列(チャット._日時)})</span></span>`
        : `<span style="color: ${チャット._発言者の色}">${チャット._発言者}</span>： ${チャット._内容.join(空文字列)} <span class="チャット日時">(${更新日時.タイムスタンプ文字列(チャット._日時)})</span>`;
      hr.classList.add("チャット区切り線");
      断片.append(span, hr);
      return 断片;
    }

    static オブジェクトから({ _発言者, _発言者の色, _内容, _日時, _宛て先 }) {
      return new チャット(_発言者, _発言者の色, _内容, _日時, _宛て先);
    }

    _発言者;
    _発言者の色;
    _内容;
    _日時;
    _宛て先;
  }

  class こうどうマネージャー {
    constructor(有効条件関数, ...こうどうリスト) {
      this.#有効条件関数 = 有効条件関数;
      this.#こうどうリスト = こうどうリスト;
    }

    出力() {
      const 枠 = document.createElement("div");
      if (!(this.#有効条件関数?.() ?? true))
        return 枠;
      for (const 各こうどう of this.#こうどうリスト) {
        if (各こうどう.出力する())
          枠.appendChild(各こうどう.出力());
      }
      return 枠;
    }

    名前が一致したこうどうを実行(名前, 対象) {
      for (const 各こうどう of this.#こうどうリスト) {
        if (各こうどう.名前 === 名前 && 各こうどう.動作する()) {
          各こうどう.実行(対象);
          return true;
        }
      }
      return false;
    }

    こうどう追加(...こうどう) {
      this.#こうどうリスト.push(...こうどう);
    }

    #有効条件関数;
    #こうどうリスト;
  }

  class こうどうインターフェース {
    constructor(名前) {
      this.#名前 = 名前 ?? this.constructor.name;
    }

    get 名前() { return this.#名前 }

    _効果() { return; }
    _クリック時効果() { return; }
    _状態取得関数() { return こうどう.状態.有効; }

    #名前;
  }

  class こうどう extends こうどうインターフェース {
    constructor(名前, 効果, 状態取得関数, クリック時効果) {
      super(名前);
      if (効果) {
        this._効果 = 効果;
      }
      if (状態取得関数) {
        this._状態取得関数 = 状態取得関数;
      }
      if (クリック時効果) {
        this._クリック時効果 = クリック時効果;
      }
    }

    実行(対象) {
      if (this._状態取得関数() === こうどう.状態.無効)
        return;
      this._効果(対象);
    }

    出力() {
      const span = クラス付きテキスト("こうどう", `＠${this.名前}`);
      /*/
      if (this._クリック時効果) {
        span.addEventListener("click", 通知欄.削除);
        span.addEventListener("click", this._クリック時効果);
      }
      else {
      //*/
      チャットフォーム.文字列追加イベントを登録(span, `＠${this.名前} `);
      //}
      return span;
    }

    出力する() {
      return this._状態取得関数() === こうどう.状態.有効;
    }

    動作する() {
      return this._状態取得関数() !== こうどう.状態.無効;
    }

    static 状態 = Object.freeze({
      無効: Symbol("無効"),
      隠しコマンド: Symbol("隠しコマンド"),
      有効: Symbol("有効")
    });

    static 状態固定 = Object.freeze(new Map([
      [こうどう.状態.無効, () => { return こうどう.状態.無効; }],
      [こうどう.状態.隠しコマンド, () => { return こうどう.状態.隠しコマンド; }],
      [こうどう.状態.有効, () => { return こうどう.状態.有効; }]
    ]));
  }

  class いどう extends こうどう {
    constructor() {
      super();
    }

    _効果(対象) {
      this._移動(対象);
    }

    _移動(移動先場所名, 訪問方法 = 場所._訪問方法.いどう) {
      if (!new Set(場所.全場所名(訪問方法)).has(移動先場所名)) {
        this._クリック時効果();
        return;
      }
      const 移動先 = 場所.一覧(移動先場所名);
      if (あなた.現在地 === 移動先) {
        通知欄.追加(`ここが${移動先.名前}です`);
        return;
      }
      あなた.チャット書き込み停止();
      あなた.場所移動(移動先);
    }

    _クリック時効果(こうどう名 = "いどう", 訪問方法 = 場所._訪問方法.いどう, 通知 = "どこに移動しますか？") {
      // 移動先候補表示
      const 断片 = document.createDocumentFragment();
      let 改行を挟む = 0;
      断片.append(通知, document.createElement("br"));
      for (const 場所名 of 場所.全場所名(訪問方法)) {
        const span = document.createElement("span");
        span.textContent = `${場所名} `;
        チャットフォーム.文字列追加イベントを登録(span, `＠${こうどう名}>${場所名} `);
        断片.append(span, "/ ");
        if (++改行を挟む % いどう先の表示で改行する項目数 === 0) {
          断片.appendChild(document.createElement("br"));
        }
      }
      通知欄.追加(断片);
    }
  }

  class まち extends いどう {
    constructor() {
      super();
    }

    _移動(移動先場所名) {
      super._移動(移動先場所名, 場所._訪問方法.まち);
    }

    _クリック時効果() {
      super._クリック時効果("まち", 場所._訪問方法.まち, "どの町に行きますか？");
    }
  }

  class アイテムをつかう extends こうどう {
    constructor() {
      super("つかう");
    }

    async _効果(対象) {
      if (対象 === undefined || アイテム.一覧(対象) === undefined) {
        this._クリック時効果();
        return;
      }
      await あなた.メンバー.アイテムを使う(対象);
    }

    _クリック時効果() {
      if (あなた.メンバー._武器) {
        通知欄.追加(あなた.メンバー._武器, `＠つかう>${あなた.メンバー._武器} `);
        通知欄.追加(" / ");
      }
      if (あなた.メンバー._防具) {
        通知欄.追加(あなた.メンバー._防具, `＠つかう>${あなた.メンバー._防具} `);
        通知欄.追加(" / ");
      }
      if (あなた.メンバー._道具) {
        通知欄.追加(あなた.メンバー._道具, `＠つかう>${あなた.メンバー._道具} `);
        通知欄.追加(" / ");
      }
      通知欄.追加(document.createElement("br"));
      for (const アイテム名 of アイテム名リスト) {
        通知欄.追加(アイテム名, `＠つかう>${アイテム名} `);
        通知欄.追加(" / ");
      }
    }
  }

  class クエストをつくる extends こうどう {
    constructor() {
      super("つくる");
    }

    _効果() {
      this.#クエスト一覧表示();
    }

    #クエスト一覧表示() {
      this._クリック時効果();
    }

    _クリック時効果() {
      通知欄.追加(`クエストつくりたい`);
    }
  }

  class ちゅうもん extends こうどう {
    constructor() {
      super();
    }

    _効果(メニュー名) {
      const _メニュー = ちゅうもん.#メニュー一覧.get(メニュー名 === あなた.メンバー.好物 ? "ﾌﾙｺｰｽ" : メニュー名);
      if (メニュー名 === undefined || _メニュー === undefined) {
        this.#メニュー一覧表示();
        return;
      }
      if (!_メニュー.注文()) {
        通知欄.追加("お金が足りないみたいね");
        return;
      }
      あなた.現在地.NPCに話させる(_メニュー.出力(メニュー名 === あなた.メンバー.好物 ? あなた.メンバー.好物 : undefined));
    }

    #メニュー一覧表示() {
      this._クリック時効果();
    }

    _クリック時効果() {
      通知欄.追加(`注文は何にするのかしら？`);
      通知欄.追加(酒場メニュー.陳列棚出力(ちゅうもん.#メニュー一覧.values()));
    }

    static 初期化() {
      this.#メニュー一覧 = new Map([
        new 酒場メニュー("ｱﾓｰﾙの水", 10, 40, 0, 1),
        new 酒場メニュー("ｵﾚﾝｼﾞｼﾞｭｰｽ", 50, 0, 30, 1),
        new 酒場メニュー("ﾄﾏﾄｼﾞｭｰｽ", 100, 10, 80, 2),
        new 酒場メニュー("ｺｰﾋｰ", 200, 0, 250, 3),
        new 酒場メニュー("ﾊｰﾌﾞﾃｨｰ", 500, 0, 500, 5),
        new 酒場メニュー("ｱｲｽｸﾘｰﾑ", 100, 30, 30, 2),
        new 酒場メニュー("ﾌﾟﾘﾝ", 200, 60, 0, 3),
        new 酒場メニュー("ﾊﾟﾌｪ", 300, 100, 100, 4),
        new 酒場メニュー("ｶﾚｰﾗｲｽ", 400, 250, 0, 5),
        new 酒場メニュー("ｽﾊﾟｹﾞﾃｨ", 600, 300, 50, 6),
        new 酒場メニュー("ｵﾑﾗｲｽ", 750, 500, 100, 7),
        new 酒場メニュー("ﾊﾝﾊﾞｰｸﾞ", 900, 800, 0, 8),
        new 酒場メニュー("ｽﾃｰｷ", 1000, 999, 0, 10),
        new 酒場メニュー("ﾌﾙｺｰｽ", 3000, 999, 999, 15)
      ].map((メニュー) => [メニュー.名前, メニュー]));
    }

    static #メニュー一覧;
  }

  class かべがみ extends こうどう {
    constructor() {
      super();
    }

    _効果(対象) {
      const _壁紙 = 壁紙.一覧(対象, false);
      if (_壁紙 === undefined) {
        this._クリック時効果();
        return;
      }
      if (!あなた.メンバー.所持金.収支(-_壁紙.価値)) {
        通知欄.追加(`${あなた}よ…ゴールドが足らん`);
        return;
      }
      あなた.現在地.NPCに話させる(`${あなた}の家の壁紙を ${対象} に、張り替えておいたよん`);
      あなた.メンバー._壁紙 = 対象;
    }

    _クリック時効果() {
      通知欄.追加([
        "どの壁紙にするのだ？",
        壁紙.陳列棚出力()
      ]);
    }
  }

  class 陳列可能インターフェース {
    constructor(名前) {
      this.#名前 = 名前;
    }

    // TODO 数を区切って表示
    static 陳列棚出力(商品リスト, クリック時のこうどう名, 価格係数 = 1) {
      const
        table = document.createElement("table"),
        tBody = document.createElement("tbody");
      table.classList.add("table1");
      let 最初 = true;
      for (const 商品 of 商品リスト) {
        if (最初) {
          最初 = false;
          if (this._陳列用ヘッダー項目名リスト !== undefined) {
            const tHead = document.createElement("thead");
            tHead.appendChild(テーブル行出力(this._陳列用ヘッダー項目名リスト, undefined, true));
            table.appendChild(tHead);
          }
        }
        // console.log(商品);
        tBody.appendChild(商品._陳列用出力(クリック時のこうどう名, 価格係数));
      }
      table.appendChild(tBody);
      return table;
    }

    get 名前() { return this.#名前; }

    _陳列用出力(クリック時のこうどう名, ...陳列用項目名リスト) {
      return テーブル行出力(陳列用項目名リスト, クリック時のこうどう名 ? `＠${クリック時のこうどう名}>${this.名前} ` : undefined, false);
    };

    static _陳列用ヘッダー項目名リスト = ["名前"];

    #名前;
  }

  class 酒場メニュー extends 陳列可能インターフェース {
    constructor(名前, 値段, ＨＰ, ＭＰ, 福引券) {
      super(名前);
      this.#値段 = 値段;
      this.#ＨＰ = ＨＰ;
      this.#ＭＰ = ＭＰ;
      this.#福引券 = 福引券;
    }

    出力(名前) {
      return `おまたせ、${名前 ?? this.名前
        }よ♪${this.#ＨＰ ? `${あなた}のＨＰが回復した！` : 空文字列
        }${this.#ＭＰ ? `${あなた}のＭＰが回復した！` : 空文字列
        }福引券を${this.#福引券}枚もらった！`;
    }

    注文() {
      if (!あなた.メンバー.所持金.収支(-this.#値段)) {
        return false;
      }
      const ステータス = あなた.メンバー.ステータス;
      ステータス.ＨＰ.現在値 += this.#ＨＰ;
      ステータス.ＭＰ.現在値 += this.#ＭＰ;
      あなた.メンバー._福引券.収支(this.#福引券);
      あなた.メンバー.ギルド?.ポイント増加(2);
      return true;
    }

    _陳列用出力() {
      return super._陳列用出力("ちゅうもん", this.名前, `${this.#値段} G`);
    }

    #値段;
    #ＨＰ;
    #ＭＰ;
    #福引券;

    static _陳列用ヘッダー項目名リスト = ["名前", "値段"];
  }

  class 取引アイテムインターフェース extends 陳列可能インターフェース {
    constructor(名前, 価値) {
      super(名前);
      this.#価値 = 価値;
    }

    get アイテム名() { return this.名前; }
    get 価値() { return this.#価値; }

    #価値;
  }

  class 裏取引アイテム extends 取引アイテムインターフェース {
    _陳列用出力(クリック時のこうどう名) {
      return super._陳列用出力(クリック時のこうどう名, this.名前, `${this.価値} Pt`);
    }

    static _陳列用ヘッダー項目名リスト = ["名前", "ﾚｱﾎﾟｲﾝﾄ"];
  }

  class メダル王の賞品 extends 取引アイテムインターフェース {
    constructor(アイテム名, 価値) {
      super(アイテム名, 価値);
      this.#アイテム名 = アイテム名;
    }

    // デフォルトに忠実
    get 名前() { return `${this.価値}枚`; }
    get アイテム名() { return this.#アイテム名; }

    _陳列用出力(クリック時のこうどう名) {
      return super._陳列用出力(クリック時のこうどう名, this.アイテム名, this.名前);
    }

    static _陳列用ヘッダー項目名リスト = ["賞品", "ﾒﾀﾞﾙ"];

    #アイテム名;
  }

  class 何でも屋の依頼 extends 陳列可能インターフェース {
    constructor(ID, 名前, 期限, 納品名, 納品数, 報酬名, 魔物依頼, ギルド依頼) {
      super(名前);
      // DB保存用
      this._名前 = 名前;

      this._ID = ID;
      this._期限 = 期限;
      this._納品名 = 納品名;
      this._納品数 = 納品数;
      this._報酬名 = 報酬名;
      this._魔物依頼 = 魔物依頼;
      this._ギルド依頼 = ギルド依頼;
    }

    _陳列用出力(ギルドマークを出力してかいけつを出さない = true) {
      const 必要アイテム = document.createDocumentFragment();
      必要アイテム.appendChild(document.createTextNode("【"));
      if (ギルドマークを出力してかいけつを出さない && this._ギルド依頼) {
        const img = document.createElement("img");
        img.src = "resource/icon/etc/mark_guild.gif";
        img.alt = "ギルド専用";
        必要アイテム.appendChild(img);
      }
      必要アイテム.append(this.#必要アイテム文字列取得(), "】");
      return super._陳列用出力(ギルドマークを出力してかいけつを出さない ? undefined : `かいけつ`,
        `『${this.名前}』`,
        必要アイテム,
        `★${this._報酬名}`,
        `〆${更新日時.タイムスタンプ文字列(this._期限)}まで`
      );
    }

    期限切れなら更新() {
      if (this._期限 >= 更新日時.取得()) {
        return undefined;
      }
      何でも屋の依頼.新規登録(this._ID);
      return `『${this.名前}』は誰も解決できそうにないので、新しい依頼がきました！<br>`;
    }

    解決() {
      if (this.#解決チェック())
        return undefined;
      あなた.依頼を完了する(this._報酬名, 100);
      何でも屋の依頼.新規登録(this._ID);
      return `${this.#必要アイテム文字列取得()} たしかに受け取りました。こちらが報酬の ${this._報酬名} になります！${あなた}さんの預り所に送っておきますね！`;
    }

    static 新規登録(ID) {
      const 依頼 = 何でも屋の依頼.#依頼の情報リスト.get((確率(何でも屋のレア依頼の確率)) ? "レア" : "通常").新規依頼作成(ID);
      データベース操作.何でも屋の依頼を更新(依頼, ID);
    }

    static オブジェクトから({ _ID, _名前, _期限, _納品名, _納品数, _報酬名, _魔物依頼, _ギルド依頼 }) {
      return new 何でも屋の依頼(_ID, _名前, _期限, _納品名, _納品数, _報酬名, _魔物依頼, _ギルド依頼);
    }

    static ダミーデータ取得(ID) {
      if (ID > 8) {
        const 依頼 = 何でも屋の依頼.#依頼の情報リスト.get((確率(何でも屋のレア依頼の確率)) ? "レア" : "通常").新規依頼作成(ID);
        依頼._期限 = 整数乱数(1160104560, 1259940495);
        return 依頼;
      }
      // データベース初期化時用
      // デフォルトに忠実
      return new 何でも屋の依頼(ID, [
        "強くなりたくてその752",
        "あこがれの服その650",
        "用途は秘密ですその521",
        "用途は秘密ですその888",
        "病気を治すためにその685",
        "着てみたいその105",
        "あこがれの服その615",
        "流行なのでその114",
        "非常用にその240"
      ][ID],
        [1260078628, 1259940495, 1260104448, 1260104673, 1260104673, 1260104686, 1260094414, 1260104560, 1260104448][ID],
        ["鉄の斧", "忍びの服", "ﾓﾝｽﾀｰ金貨", "ﾓﾝｽﾀｰ銀貨", "魔法の聖水", "水の羽衣", "ｽﾗｲﾑｱｰﾏｰ", "魔法の法衣", "悪魔のしっぽ"][ID],
        [4, 6, 5, 2, 3, 4, 2, 10, 5][ID],
        ["馬のﾌﾝ", "魔除けの聖印", "聖者の灰", "聖者の灰", "金塊", "応用錬金ﾚｼﾋﾟ", "金塊", "馬のﾌﾝ", "聖者の灰"][ID],
        false,
        ID === 1 || ID === 7
      );
    }

    static 初期化() {
      何でも屋の依頼.#依頼の情報リスト = new Map([
        ["通常", new 依頼の候補(
          [
            [...アイテム.名前範囲("ひのきの棒", "ﾋﾞｯｸﾞﾎﾞｳｶﾞﾝ")],
            [...アイテム.名前範囲("布の服", "水の羽衣")],
            [
              ...アイテム.名前範囲("薬草", "水の羽衣"),
              ...アイテム.名前範囲("精霊の守り", "へんげの杖"),
              ...アイテム.名前範囲("ｼﾙﾊﾞｰｵｰﾌﾞ", "ﾊﾟｰﾌﾟﾙｵｰﾌﾞ"),
              ...アイテム.名前範囲("身代わり人形", "復活の草"),
              "ﾁｮｺﾎﾞの羽"
            ],
            [...new 範囲(4, 120), ...new 範囲(198, 260)],
            [...new 範囲(1, 3)]
          ],
          [...new 連続("応用錬金ﾚｼﾋﾟ", 3), ...アイテム.名前範囲("馬のﾌﾝ", "聖者の灰"), ...new 連続("金塊", 2)]
        )],
        ["レア", new 依頼の候補(
          [
            [...アイテム.名前範囲("諸刃の剣", "ﾊｸﾞﾚﾒﾀﾙの剣")],
            [...アイテム.名前範囲("闇の衣", "ﾊｸﾞﾚﾒﾀﾙの鎧")],
            [
              "勇者の証", "邪神像", "ｼﾞｪﾉﾊﾞ細胞", "ｴｯﾁな本", "天馬のたづな",
              ...アイテム.名前範囲("ﾗｰの鏡", "天空の盾と兜"),
              ...アイテム.名前範囲("次元のｶｹﾗ", "宝物庫の鍵"),
              "ｲﾝﾃﾘﾒｶﾞﾈ"
            ],
            [...new 範囲(500, 579)],
            [...new 範囲(160, 165)]
          ],
          [...new 連続("神の錬金ﾚｼﾋﾟ", 3), ...アイテム.名前範囲("ｽﾗｲﾑの冠", "ﾛﾄの印")]
        )]
      ]);
    }

    static _陳列用ヘッダー項目名リスト = ["依頼名", "クリア条件", "報酬", "期限"];

    #解決チェック() {
      try {
        if (this._ギルド依頼 && !あなた.メンバー.ギルド === undefined)
          throw `${this.名前}はギルド専用のクエストよ。ギルドに加入していないと依頼を受けることができないわ`;
        if (this._魔物依頼 ? モンスター倉庫.画像から削除(this._納品名, this._納品数) : アイテム倉庫.削除(this._納品名, this._納品数))
          throw `${this.#必要アイテム文字列取得()} の条件を満たしてないようです`;
      }
      catch (エラー) {
        通知欄.追加(エラー);
        return true;
      }
      return false;
    }

    #必要アイテム文字列取得() {
      if (!this._魔物依頼) {
        return アイテム.一覧(this._納品名).名前と個数出力(this._納品数);
      }
      const img = document.createElement("img");
      img.src = `resource/icon/mon/${("000" + this._納品名).slice(-3)}.gif`;
      return アイテム.名前と個数出力(this._納品数, "匹", img);
    }

    #納品;

    static #依頼の情報リスト;
  }

  class 依頼の候補 {
    constructor(納品候補リスト, 報酬候補リスト) {
      this.#納品候補リスト = 納品候補リスト;
      this.#報酬候補リスト = 報酬候補リスト;
    }

    新規依頼作成(ID) {
      const
        種類 = 整数乱数(4),
        魔物依頼 = 種類 === 3,
        ギルド依頼 = 確率(何でも屋のギルド依頼の確率),
        依頼名 = 依頼の候補.ランダムな依頼名取得(種類),
        期限日時 = 更新日時.取得() + 60 * 60 * 24 * 何でも屋の解決期限日数,
        必要数 = (魔物依頼 ? 整数乱数(何でも屋の魔物依頼の最大必要数, 何でも屋の魔物依頼の最小必要数, true)
          : 整数乱数(何でも屋のアイテム依頼の最大必要数, 何でも屋のアイテム依頼の最小必要数, true))
          * (ギルド依頼 ? 何でも屋のギルド依頼の必要数倍率 : 1),
        報酬名 = ギルド依頼 ? 何でも屋のギルド依頼の固定報酬 : ランダムな1要素(this.#報酬候補リスト),
        納品名 = ランダムな1要素(this.#納品候補リスト[種類]);
      // TODO if (魔物依頼 && 存在しない画像) { 納品名 = ランダムな1要素( this.#納品名候補リスト[4])}
      // ローカルならimgElement.onerrorとか？

      return new 何でも屋の依頼(ID, 依頼名, 期限日時, 納品名, 必要数, 報酬名, 魔物依頼, ギルド依頼);
    }

    static ランダムな依頼名取得(種類) {
      return ランダムな1要素([
        ["店を始めたいので", "強くなりたくて", "戦い用に", "ライバルに勝ちたくて", "見てみたい", "趣味で", "家宝にしたい", "探しています"],
        ["コンプリートのために", "カッコ良くなりたい", "オシャレになりたくて", "あこがれの服", "プレゼント用に", "着てみたい", "集めたい", "流行なので"],
        ["コレクション用", "病気を治すために", "非常用に", "必要なんです", "大好物なので", "気になるので", "自分用に欲しい", "用途は秘密です"],
        ["かわいいので", "ペットほしい", "仲良くなりたい", "プニプニしたい", "いやされたい", "触ってみたい", "背中に乗ってみたい", "幸せになるために", "王国を作るために"]
      ][種類]) + "その" + 整数乱数(999, 1, true);
    }

    #納品候補リスト;
    #報酬候補リスト;
  }

  class 錬金レシピ extends 陳列可能インターフェース {
    constructor(素材1, 素材2, 完成品) {
      super();
      this._素材1 = 素材1;
      this._素材2 = 素材2;
      this._完成品 = 完成品;
      this.#習得難易度 = 錬金レシピ.#難易度別の素材1.findIndex((セット) => セット.has(素材1));
      if (this.#習得難易度 === -1) {
        this.#習得難易度 = Infinity;
      }
    }

    _陳列用出力(完成品を表示する = true) {
      return super._陳列用出力([
        this._素材1,
        `×${this._素材2}`,
        `＝${完成品を表示する ? this._完成品 : "？？？"}`
      ], `＠れんきん>${this.素材1}＠そざい>${this.素材2} `);
    }

    static 習得(習得済み錬金レシピ一覧, 難易度 = Infinity) {
      // 原作に忠実な実装
      const 習得レシピ = ランダムな1要素(ランダムな1要素(
        Array.from(錬金レシピ.#一覧, ([素材1, 錬金レシピリスト]) =>
          Array.from(錬金レシピリスト, ([素材2, 錬金レシピ]) =>
            (習得済み錬金レシピ一覧.get(素材1)?.get(素材2) || (難易度 !== Infinity && 錬金レシピ.#習得難易度 !== 難易度)) ? undefined : 錬金レシピ
            , 錬金レシピ).filter((素材2) => 素材2 !== undefined)
        ).filter((習得レシピ候補リスト) => 習得レシピ候補リスト.length !== 0)
      ));
      あなた.メンバー.データベースに錬金レシピを保存(習得レシピ);
    }

    static 初期化() {
      [
        new 錬金レシピ("薬草", "薬草", "上薬草"),
        new 錬金レシピ("薬草", "爆弾石", "ﾄﾞﾗｺﾞﾝ草"),
        new 錬金レシピ("上薬草", "上薬草", "特薬草"),
        new 錬金レシピ("特薬草", "命の木の実", "世界樹の葉"),
        new 錬金レシピ("毒消し草", "満月草", "ﾊﾟﾃﾞｷｱの根っこ"),
        new 錬金レシピ("世界樹の葉", "魔法の聖水", "世界樹のしずく"),
        new 錬金レシピ("魔法の聖水", "世界樹のしずく", "ｴﾙﾌの飲み薬"),
        new 錬金レシピ("幸せの種", "聖者の灰", "ｽｷﾙの種"),
        new 錬金レシピ("幸せの帽子", "幸せの種", "幸せのくつ"),
        new 錬金レシピ("幸せの帽子", "幸せのくつ", "幸福袋"),
        new 錬金レシピ("幸せのくつ", "幸せの種", "幸せの帽子"),
        new 錬金レシピ("ｽｷﾙの種", "魔法の粉", "幸せの種"),
        new 錬金レシピ("ｷﾒﾗの翼", "幸せのくつ", "宝物庫の鍵"),
        new 錬金レシピ("身代わり人形", "守りの石", "身代わり石像"),
        new 錬金レシピ("身代わり石像", "守りのﾙﾋﾞｰ", "上薬草"),
        new 錬金レシピ("魔法の粉", "馬のﾌﾝ", "悪魔の粉"),
        new 錬金レシピ("金の鶏", "魔物のｴｻ", "金塊"),
        new 錬金レシピ("魔獣の皮", "幸せの種", "福袋"),
        new 錬金レシピ("竜のｳﾛｺ", "皮の腰巻", "魔獣の皮"),
        new 錬金レシピ("銀のたてごと", "魔法の聖水", "魔除けの聖印"),
        new 錬金レシピ("ﾓﾝｽﾀｰ銅貨", "ﾓﾝｽﾀｰ銅貨", "ﾓﾝｽﾀｰ銀貨"),
        new 錬金レシピ("ﾓﾝｽﾀｰ銀貨", "ﾓﾝｽﾀｰ銀貨", "ﾓﾝｽﾀｰ金貨"),
        new 錬金レシピ("ﾓﾝｽﾀｰ金貨", "ﾓﾝｽﾀｰ金貨", "小さなﾒﾀﾞﾙ"),
        new 錬金レシピ("祈りの指輪", "金塊", "金の指輪"),
        new 錬金レシピ("金の指輪", "命の木の実", "命の指輪"),
        new 錬金レシピ("金の指輪", "不思議な木の実", "祈りの指輪"),
        new 錬金レシピ("金の指輪", "力の種", "上薬草"),
        new 錬金レシピ("金の指輪", "守りの種", "守りのﾙﾋﾞｰ"),
        new 錬金レシピ("金の指輪", "素早さの種", "はやてのﾘﾝｸﾞ"),
        new 錬金レシピ("金の指輪", "金の指輪", "金のﾌﾞﾚｽﾚｯﾄ"),
        new 錬金レシピ("金の指輪", "死者の骨", "ﾄﾞｸﾛの指輪"),
        new 錬金レシピ("闇のﾛｻﾞﾘｵ", "聖者の灰", "金のﾛｻﾞﾘｵ"),
        new 錬金レシピ("金のﾌﾞﾚｽﾚｯﾄ", "命の指輪", "命のﾌﾞﾚｽﾚｯﾄ"),
        new 錬金レシピ("力の指輪", "力の指輪", "ごうけつの腕輪"),
        new 錬金レシピ("はやてのﾘﾝｸﾞ", "はやてのﾘﾝｸﾞ", "ほしふる腕輪"),
        new 錬金レシピ("ごうけつの腕輪", "ほしふる腕輪", "ｱﾙｺﾞﾝﾘﾝｸﾞ"),
        new 錬金レシピ("ごうけつの腕輪", "爆弾石", "ﾒｶﾞﾝﾃの腕輪"),
        new 錬金レシピ("ごうけつの腕輪", "金塊", "怒りのﾀﾄｩｰ"),
        new 錬金レシピ("ｿｰｻﾘｰﾘﾝｸﾞ", "悪魔のしっぽ", "ﾄﾞｸﾛの指輪"),
        new 錬金レシピ("ﾄﾞｸﾛの指輪", "聖者の灰", "ｿｰｻﾘｰﾘﾝｸﾞ"),

        new 錬金レシピ("ひのきの棒", "ﾀﾞｶﾞｰﾅｲﾌ", "鉄の槍"),
        new 錬金レシピ("ひのきの棒", "鉄の槍", "ﾛﾝｸﾞｽﾋﾟｱ"),
        new 錬金レシピ("こんぼう", "ﾁｪｰﾝｸﾛｽ", "ﾓｰﾆﾝｸﾞｽﾀｰ"),
        new 錬金レシピ("ﾌﾞﾛﾝｽﾞﾅｲﾌ", "ﾌﾞﾛﾝｽﾞﾅｲﾌ", "銅の剣"),
        new 錬金レシピ("ﾌﾞﾛﾝｽﾞﾅｲﾌ", "聖者の灰", "聖なるﾅｲﾌ"),
        new 錬金レシピ("ﾀﾞｶﾞｰﾅｲﾌ", "どくばり", "ｱｻｼﾝﾀﾞｶﾞｰ"),
        new 錬金レシピ("ｿﾞﾝﾋﾞｷﾗｰ", "魔除けの聖印", "ｿﾞﾝﾋﾞﾊﾞｽﾀｰ"),
        new 錬金レシピ("ﾙｰﾝｽﾀｯﾌ", "ﾗｲﾄｱｰﾏｰ", "ﾗｲﾄｼｬﾑｰﾙ"),
        new 錬金レシピ("ﾛﾝｸﾞｽﾋﾟｱ", "聖なるﾅｲﾌ", "ﾎｰﾘｰﾗﾝｽ"),
        new 錬金レシピ("ﾛﾝｸﾞｽﾋﾟｱ", "悪魔のしっぽ", "ﾊﾞﾄﾙﾌｫｰｸ"),
        new 錬金レシピ("ﾊﾞﾄﾙﾌｫｰｸ", "どくばり", "ﾃﾞｰﾓﾝｽﾋﾟｱ"),
        new 錬金レシピ("ﾎｰﾘｰﾗﾝｽ", "悪魔のしっぽ", "ﾃﾞｰﾓﾝｽﾋﾟｱ"),
        new 錬金レシピ("ﾓｰﾆﾝｸﾞｽﾀｰ", "ﾄﾞﾗｺﾞﾝｷﾗｰ", "ﾄﾞﾗｺﾞﾝﾃｲﾙ"),
        new 錬金レシピ("鋼鉄の剣", "金塊", "ﾌﾟﾗﾁﾅｿｰﾄﾞ"),
        new 錬金レシピ("鋼鉄の剣", "馬のﾌﾝ", "古びた剣"),
        new 錬金レシピ("ｽﾗｲﾑﾋﾟｱｽ", "はやてのﾘﾝｸﾞ", "ｷﾗｰﾋﾟｱｽ"),
        new 錬金レシピ("理力の杖", "ﾄﾞﾗｺﾞﾝ草", "ﾄﾞﾗｺﾞﾝの杖"),
        new 錬金レシピ("ｸｻﾅｷﾞの剣", "聖者の灰", "ﾊﾞｽﾀｰﾄﾞｿｰﾄﾞ"),
        new 錬金レシピ("ﾊﾞｽﾀｰﾄﾞｿｰﾄﾞ", "氷の刃", "吹雪の剣"),
        new 錬金レシピ("ﾊﾞｽﾀｰﾄﾞｿｰﾄﾞ", "妖精の笛", "妖精の剣"),
        new 錬金レシピ("銅の剣", "魔除けの聖印", "聖銀のﾚｲﾋﾟｱ"),
        new 錬金レシピ("銅の剣", "馬のﾌﾝ", "古びた剣"),
        new 錬金レシピ("聖銀のﾚｲﾋﾟｱ", "悪魔のしっぽ", "堕天使のﾚｲﾋﾟｱ"),
        new 錬金レシピ("堕天使のﾚｲﾋﾟｱ", "はやてのﾘﾝｸﾞ", "疾風のﾚｲﾋﾟｱ"),
        new 錬金レシピ("鎖がま", "鎖がま", "鉄の斧"),
        new 錬金レシピ("鉄の斧", "鉄の斧", "ﾊﾞﾄﾙｱｯｸｽ"),
        new 錬金レシピ("鉄の斧", "金塊", "金の斧"),
        new 錬金レシピ("ﾊﾞﾄﾙｱｯｸｽ", "盗賊の衣", "山賊の斧"),
        new 錬金レシピ("山賊の斧", "王者のﾏﾝﾄ", "覇王の斧"),
        new 錬金レシピ("おおきづち", "鉄の斧", "おおかなづち"),
        new 錬金レシピ("ｳｫｰﾊﾝﾏｰ", "ごうけつの腕輪", "ｳｫｰﾊﾝﾏｰ･改"),
        new 錬金レシピ("ｳｫｰﾊﾝﾏｰ･改", "覇王の斧", "ﾒｶﾞﾄﾝﾊﾝﾏｰ"),
        new 錬金レシピ("隼の剣", "ほしふる腕輪", "隼の剣･改"),
        new 錬金レシピ("諸刃の剣", "聖者の灰", "諸刃の剣･改"),
        new 錬金レシピ("諸刃の剣", "魔除けの聖印", "氷の刃"),
        new 錬金レシピ("奇跡の剣", "命のﾌﾞﾚｽﾚｯﾄ", "奇跡の剣･改"),
        new 錬金レシピ("古びた剣", "ｵﾘﾊﾙｺﾝ", "ﾊｸﾞﾚﾒﾀﾙの剣"),
        new 錬金レシピ("ﾊｸﾞﾚﾒﾀﾙの剣", "ｽﾗｲﾑの冠", "ﾒﾀﾙｷﾝｸﾞの剣"),
        new 錬金レシピ("ﾒﾀﾙｷﾝｸﾞの剣", "ﾛﾄの印", "ﾛﾄの剣"),
        new 錬金レシピ("ﾄﾞﾗｺﾞﾝｷﾗｰ", "ごうけつの腕輪", "ﾄﾞﾗｺﾞﾝｽﾚｲﾔｰ"),
        new 錬金レシピ("ﾄﾞﾗｺﾞﾝｽﾚｲﾔｰ", "ｵﾘﾊﾙｺﾝ", "竜神の剣"),
        new 錬金レシピ("竜神の剣", "ﾊｸﾞﾚﾒﾀﾙの剣", "竜神王の剣"),

        new 錬金レシピ("布の服", "布の服", "旅人の服"),
        new 錬金レシピ("旅人の服", "魔獣の皮", "皮の鎧"),
        new 錬金レシピ("旅人の服", "騎士団の衣装", "騎士団の服"),
        new 錬金レシピ("旅人の服", "ﾁｪｰﾝｸﾛｽ", "鎖かたびら"),
        new 錬金レシピ("皮の鎧", "竜のｳﾛｺ", "うろこの鎧"),
        new 錬金レシピ("鎖かたびら", "銅の剣", "青銅の鎧"),
        new 錬金レシピ("鉄の鎧", "銀のたてごと", "ｼﾙﾊﾞｰﾒｲﾙ"),
        new 錬金レシピ("鉄の鎧", "馬のﾌﾝ", "古びた鎧"),
        new 錬金レシピ("鋼鉄の鎧", "諸刃の剣", "刃の鎧"),
        new 錬金レシピ("鋼鉄の鎧", "馬のﾌﾝ", "古びた鎧"),
        new 錬金レシピ("鋼鉄の鎧", "魔獣の皮", "あつでの鎧"),
        new 錬金レシピ("銀の胸当て", "金塊", "金の胸当て"),
        new 錬金レシピ("さまよう鎧", "魔除けの聖印", "ﾗｲﾄｱｰﾏｰ"),
        new 錬金レシピ("ｼﾙﾊﾞｰﾒｲﾙ", "ｿﾞﾝﾋﾞｷﾗｰ", "ｿﾞﾝﾋﾞﾒｲﾙ"),
        new 錬金レシピ("ｼﾙﾊﾞｰﾒｲﾙ", "魔獣の皮", "ﾄﾞﾗｺﾞﾝﾒｲﾙ"),
        new 錬金レシピ("ｿﾞﾝﾋﾞﾒｲﾙ", "聖者の灰", "ﾌﾟﾗﾁﾅﾒｲﾙ"),
        new 錬金レシピ("魔法の法衣", "聖者の灰", "賢者のﾛｰﾌﾞ"),
        new 錬金レシピ("賢者のﾛｰﾌﾞ", "炎の鎧", "紅蓮のﾛｰﾌﾞ"),
        new 錬金レシピ("光の鎧", "危ない水着", "神秘の鎧"),
        new 錬金レシピ("毛皮のﾏﾝﾄ", "はやてのﾘﾝｸﾞ", "盗賊の衣"),
        new 錬金レシピ("魔人の鎧", "ごうけつの腕輪", "ｷﾞｶﾞﾝﾄｱｰﾏｰ"),
        new 錬金レシピ("古びた鎧", "ｵﾘﾊﾙｺﾝ", "ﾊｸﾞﾚﾒﾀﾙの鎧"),
        new 錬金レシピ("ﾊｸﾞﾚﾒﾀﾙの鎧", "ｽﾗｲﾑの冠", "ﾒﾀﾙｷﾝｸﾞの鎧"),
        new 錬金レシピ("ﾒﾀﾙｷﾝｸﾞの鎧", "ﾛﾄの印", "ﾛﾄの鎧"),
        new 錬金レシピ("ﾄﾞﾗｺﾞﾝﾒｲﾙ", "ごうけつの腕輪", "ﾄﾞﾗｺﾞﾝｱｰﾏｰ"),
        new 錬金レシピ("ﾄﾞﾗｺﾞﾝｱｰﾏｰ", "ｵﾘﾊﾙｺﾝ", "竜神の鎧"),
        new 錬金レシピ("竜神の鎧", "ﾊｸﾞﾚﾒﾀﾙの鎧", "竜神王の鎧"),
      ].forEach(錬金レシピ.#一覧作成);
    }

    一覧(素材1, 素材2) {
      return this.#一覧.get(素材1)?.get(素材2);
    }

    static _陳列用ヘッダー項目名リスト = undefined;

    static #一覧作成(_錬金レシピ) {
      const
        新規作成する = !錬金レシピ.#一覧.has(_錬金レシピ._素材1),
        map = 新規作成する ? new Map() : 錬金レシピ.#一覧.get(_錬金レシピ._素材1);
      if (新規作成する) {
        錬金レシピ.#一覧.set(_錬金レシピ._素材1, map);
      }
      map.set(_錬金レシピ._素材2, _錬金レシピ);
    }

    #習得難易度;

    static #一覧 = new Map();
    static #難易度別の素材1 = Object.freeze([
      new Set([
        "薬草", "上薬草", "特薬草", "毒消し草", "身代わり人形", "竜のｳﾛｺ", "ﾓﾝｽﾀｰ銅貨", "ﾓﾝｽﾀｰ銀貨", "闇のﾛｻﾞﾘｵ",
        "魔獣の皮", "祈りの指輪", "金の指輪", "ひのきの棒", "こんぼう", "ﾌﾞﾛﾝｽﾞﾅｲﾌ", "ﾀﾞｶﾞｰﾅｲﾌ", "ﾙｰﾝｽﾀｯﾌ", "ﾛﾝｸﾞｽﾋﾟｱ", "ｸｻﾅｷﾞの剣",
        "銅の剣", "聖銀のﾚｲﾋﾟｱ", "鎖がま", "鉄の斧", "金の斧", "おおきづち", "布の服", "旅人の服", "皮の鎧", "鎖かたびら",
        "鉄の鎧", "鋼鉄の鎧", "さまよう鎧", "ｿﾞﾝﾋﾞﾒｲﾙ", "魔法の法衣"
      ]),
      new Set([
        "世界樹の葉", "魔法の聖水", "幸せの種", "ｽｷﾙの種", "身代わり石像", "銀のたてごと", "魔法の粉", "悪魔の粉", "金の鶏", "ﾓﾝｽﾀｰ金貨",
        "金のﾌﾞﾚｽﾚｯﾄ", "怒りのﾀﾄｩｰ", "ｿｰｻﾘｰﾘﾝｸﾞ", "ｿﾞﾝﾋﾞｷﾗｰ", "ﾊﾞﾄﾙﾌｫｰｸ", "ﾎｰﾘｰﾗﾝｽ", "ﾓｰﾆﾝｸﾞｽﾀｰ", "鋼鉄の剣", "ｽﾗｲﾑﾋﾟｱｽ", "理力の杖",
        "ﾊﾞｽﾀｰﾄﾞｿｰﾄﾞ", "堕天使のﾚｲﾋﾟｱ", "ﾊﾞﾄﾙｱｯｸｽ", "山賊の斧", "銀の胸当て", "みかわしの服", "ｼﾙﾊﾞｰﾒｲﾙ", "賢者のﾛｰﾌﾞ", "毛皮のﾏﾝﾄ", "魔人の鎧"
      ])
    ]);
  }

  class ユーザー個別錬金レシピ extends 錬金レシピ {
    constructor(錬金レシピ, 作成済み) {
      super(錬金レシピ._素材1, 錬金レシピ._素材2, 錬金レシピ._完成品);
      this._作成済み = 作成済み;
    }

    _陳列用出力() {
      return super._陳列用出力(this._作成済み);
    }

    get 作成済み() { return this._作成済み; }

    static オブジェクトから({ _素材1, _素材2, _完成品 }) {
      return new ユーザー個別錬金レシピ(new 錬金レシピ(_素材1, _素材2, _完成品));
    }
  }

  // TODO 錬金レシピ読み込み君

  class アイテム extends 取引アイテムインターフェース {
    constructor(名前, 価値) {
      super(名前, 価値);
      this.#ID = アイテム.#自動ID++;
    }

    名前と個数出力(個数) {
      アイテム.名前と個数出力(個数, 空文字列, this.名前);
    }

    こうどう用出力(こうどう名, 末尾にスラッシュをつける = true) {
      const span = document.createElement("span");
      span.textContent = this.名前;
      チャットフォーム.文字列追加イベントを登録(span, `＠${こうどう名}>${this.名前} `);
      if (!末尾にスラッシュをつける) {
        return span;
      }
      const 断片 = document.createDocumentFragment();
      断片.append(span, " / ");
      return 断片;
    }

    get ID() { return this.#ID; }

    static 名前と個数出力(個数, 単位, 名前) {
      const
        全体 = document.createDocumentFragment(),
        _個数 = document.createElement("span");
      _個数.classList.add("強調");
      _個数.textContent = 個数;
      if (名前.nodeType === undefined) {
        名前 = document.createTextNode(名前);
      }
      全体.appendChild(名前, " ", _個数, ` ${単位}`);
      return 全体;
    }

    static 図鑑出力(アイテムリスト, テーブル) {
      テーブル.textContent = 空文字列;
      const
        tHead = document.createElement("thead"),
        tBody = document.createElement("tbody");
      let 最初 = true;
      for (const アイテム of アイテムリスト) {
        if (最初) {
          最初 = false;
          tHead.appendChild(テーブル行出力(this._図鑑用ヘッダー項目名リスト, undefined, true));
          テーブル.appendChild(tHead);
        }
        tBody.appendChild(アイテム._図鑑用出力());
      }
      テーブル.appendChild(tBody);
    }

    static 範囲(アイテム名から, アイテム名まで, ID増加量 = 0, ID最大増加時のアイテム名) {
      const IDまで = this.一覧(アイテム名まで).ID + ID増加量;
      return new アイテム範囲(
        this.一覧(アイテム名から).ID,
        (ID最大増加時のアイテム名 === undefined) ? IDまで
          : Math.min(IDまで, this.一覧(ID最大増加時のアイテム名).ID)
      );
    }

    static 名前範囲(アイテム名から, アイテム名まで, ID増加量 = 0, ID最大増加時のアイテム名) {
      return new アイテム名前範囲(this.一覧(アイテム名から).ID, this.一覧(アイテム名まで).ID);
    }

    static 連続(アイテム名, 数) {
      return new アイテム連続(this.一覧(アイテム名).ID, 数);
    }

    static 初期化() {
      アイテム.#IDから = new Map();
      this.#一覧 = new Map([
        new アイテム("なし"),

        // ＠説明書は(主に上限か下限に0を含む範囲について)境界を含むかどうかで間違いがあるので信用してはならない
        new 武器("ひのきの棒", 10, 2, new 範囲(1)),
        new 武器("竹の槍", 30, 4, 2),
        new 武器("こんぼう", 50, new 範囲(16, 0, 8), 6),
        new 武器("かしの杖", 70, 6, new 範囲(4)),
        new 武器("いばらのむち", 180, new 範囲(14), 5),
        new 武器("ﾌﾞﾛﾝｽﾞﾅｲﾌ", 120, 9, new 範囲(6)),
        new 武器("おおきづち", 250, new 範囲(40, 0, 40), 12),
        new 武器("銅の剣", 400, 14, 9),
        new 武器("鎖がま", 540, new 範囲(23), 10),
        new 武器("聖なるﾅｲﾌ", 670, 18, new 範囲(14)),
        new 武器("鉄の斧", 900, new 範囲(60, 0, 30), 25),
        new 武器("どくばり", 1500, new 範囲(42, 0, 42), 4),
        new 武器("鋼鉄の剣", 1800, 30, 20),
        new 武器("ﾙｰﾝｽﾀｯﾌ", 2100, 27, new 範囲(24)),
        new 武器("ｿﾞﾝﾋﾞｷﾗｰ", 3500, 44, 24),
        new 武器("ﾁｪｰﾝｸﾛｽ", 3700, new 範囲(59), 20),
        new 武器("ｱｻｼﾝﾀﾞｶﾞｰ", 5500, new 範囲(54, 0, 18), 16),
        new 武器("ｸｻﾅｷﾞの剣", 8500, 54, 34),
        new 武器("ﾎｰﾘｰﾗﾝｽ", 7500, 47, new 範囲(49)),
        new 武器("ﾊﾞﾄﾙｱｯｸｽ", 7200, new 範囲(100, 0, 50), 38),
        new 武器("ﾓｰﾆﾝｸﾞｽﾀｰ", 9500, new 範囲(89), 32),
        new 武器("ｳｫｰﾊﾝﾏｰ", 11000, new 範囲(150, 0, 150), 50),
        new 武器("ﾄﾞﾗｺﾞﾝｷﾗｰ", 15000, 75, 45),
        new 武器("妖精の剣", 13000, 65, new 範囲(69)),
        new 武器("ﾃﾞｰﾓﾝｽﾋﾟｱ", 16000, 99, 66),
        new 武器("ﾄﾞﾗｺﾞﾝﾃｲﾙ", 19500, new 範囲(119), 45),
        new 武器("ﾋﾞｯｸﾞﾎﾞｳｶﾞﾝ", 22500, new 範囲(180, 0, 180), 60),
        new 武器("諸刃の剣", 2000, -20, new 範囲(0, -39)),
        new 武器("隼の剣", 21000, 5, new 範囲(0, -39)),
        new 武器("奇跡の剣", 17700, 70, new 範囲(20, 0, 20)),
        new 武器("ｷﾗｰﾋﾟｱｽ", 14000, new 進む人のステータス依存("素早さ", 1.2), new 範囲(49)),
        new 武器("正義のｿﾛﾊﾞﾝ", 18750, new 進む人のステータス依存("守備力", 1.2), 40),
        new 武器("ｶﾞｲｱの剣", 24000, new 進む人のステータス依存("攻撃力", 1.2), 40),
        new 武器("理力の杖", 17000, new 進む人のステータス依存("ＭＰ", 0.6), new 範囲(69)),
        new 武器("天空の剣", 30000, new 進む人のステータス依存("ＨＰ"), 50),
        new 武器("ﾄﾞﾗｺﾞﾝの杖", 22000, 90, new 範囲(99)),
        new 武器("魔人の斧", 20000, new 範囲(300, 0, 300), 70),
        new 武器("ｸﾞﾘﾝｶﾞﾑのむち", 28000, new 範囲(199), 55),
        new 武器("破壊の鉄球", 27750, new 範囲(300, 0, 150), 80),
        new 武器("ﾊｸﾞﾚﾒﾀﾙの剣", 30000, 150, 75),
        new 武器("古びた剣", 10, 1, 30),
        new 武器("鉄の槍", 740, 22, 12),
        new 武器("ﾀﾞｶﾞｰﾅｲﾌ", 300, 14, new 範囲(10)),
        new 武器("おおかなづち", 850, new 範囲(60, 0, 60), 15),
        new 武器("ﾛﾝｸﾞｽﾋﾟｱ", 1100, 31, 19),
        new 武器("ﾊﾞﾄﾙﾌｫｰｸ", 2000, 36, 10),
        new 武器("金の斧", 4000, new 範囲(60, 0, 20), 30),
        new 武器("山賊の斧", 6000, new 範囲(120, 0, 20), 55),
        new 武器("氷の刃", 7400, 52, 26),
        new 武器("吹雪の剣", 17000, 80, 39),
        new 武器("隼の剣･改", 27000, 45, new 範囲(0, -39)),
        new 武器("諸刃の刃･改", 6000, -30, new 範囲(0, -59)),
        new 武器("ｳｫｰﾊﾝﾏｰ･改", 16000, new 範囲(240, 0, 120), 60),
        new 武器("奇跡の剣･改", 21100, 85, new 範囲(10, 0, 10)),
        new 武器("ｿﾞﾝﾋﾞﾊﾞｽﾀｰ", 14000, 65, 45),
        new 武器("ﾄﾞﾗｺﾞﾝｽﾚｲﾔｰ", 20000, 96, 50),
        new 武器("ﾊﾞｽﾀｰﾄﾞｿｰﾄﾞ", 8000, 60, 20),
        new 武器("ﾗｲﾄｼｬﾑｰﾙ", 21000, 110, 55),
        new 武器("ﾌﾟﾗﾁﾅｿｰﾄﾞ", 16000, 84, 40),
        new 武器("ﾒｶﾞﾄﾝﾊﾝﾏｰ", 22000, new 範囲(300, 0, 300), 85),
        new 武器("ﾑｰﾝｱｯｸｽ", 12000, new 範囲(210, 0, 70), 55),
        new 武器("ｷﾝｸﾞｱｯｸｽ", 28000, new 範囲(270, 0, 90), 65),
        new 武器("覇王の斧", 30000, new 範囲(300, 0, 100), 80),
        new 武器("聖銀のﾚｲﾋﾟｱ", 7000, 54, 16),
        new 武器("堕天使のﾚｲﾋﾟｱ", 12000, 61, 11),
        new 武器("疾風のﾚｲﾋﾟｱ", 20000, 78, new 範囲(0, -29)),
        new 武器("ﾒﾀﾙｷﾝｸﾞの剣", 40000, 165, 80),
        new 武器("ﾛﾄの剣", 50000, 180, new 進む人のステータス依存("ＨＰ", 0.2, true)),
        new 武器("竜神の剣", 40000, new 進む人のステータス依存("攻撃力", 1.2), 40),
        new 武器("竜神王の剣", 50000, new 進む人のステータス依存("攻撃力", 1.6), 50),

        new 防具("布の服", 20, 3, 0),
        new 防具("旅人の服", 50, 5, new 範囲(1)),
        new 防具("ｽﾃﾃｺﾊﾟﾝﾂ", 70, -2, new 範囲(0, -11)),
        new 防具("皮の鎧", 150, 12, 4),
        new 防具("皮の腰巻", 240, new 範囲(10), new 範囲(5)),
        new 防具("うろこの鎧", 380, new 範囲(16, 7), 6),
        new 防具("鎖かたびら", 540, 24, 8),
        new 防具("毛皮のﾏﾝﾄ", 350, new 範囲(19), new 範囲(9)),
        new 防具("ｽﾗｲﾑの服", 600, 30, new 範囲(17)),
        new 防具("青銅の鎧", 830, new 範囲(34, 15), 12),
        new 防具("鉄の鎧", 1200, 43, 17),
        new 防具("安らぎのﾛｰﾌﾞ", 1700, 34, new 範囲(19)),
        new 防具("さまよう鎧", 900, new 範囲(90, 0, 90), 22),
        new 防具("みかわしの服", 2800, 0, new 範囲(0, -54)),
        new 防具("ｽﾗｲﾑｱｰﾏｰ", 3000, new 範囲(39, 10), new 範囲(19)),
        new 防具("鋼鉄の鎧", 3700, 52, 20),
        new 防具("ｿﾞﾝﾋﾞﾒｲﾙ", 4400, new 範囲(59, 30), 22),
        new 防具("魔法の法衣", 5400, 45, new 範囲(24)),
        new 防具("銀の胸当て", 6700, 73, 24),
        new 防具("ﾃﾞﾋﾞﾙｱｰﾏｰ", 2000, new 範囲(140, 0, 140), 22),
        new 防具("賢者のﾛｰﾌﾞ", 9000, 62, new 範囲(29)),
        new 防具("刃の鎧", 7000, new 範囲(80, 0, 40), 27),
        new 防具("忍びの服", 16000, new 範囲(24), new 範囲(0, -29)),
        new 防具("天使のﾛｰﾌﾞ", 15000, 70, new 範囲(34)),
        new 防具("ﾌﾞﾗｯﾄﾞﾒｲﾙ", 3500, new 範囲(180, 0, 180), 33),
        new 防具("ﾄﾞﾗｺﾞﾝﾒｲﾙ", 17500, 76, 30),
        new 防具("水の羽衣", 18500, new 範囲(79, 30), new 範囲(39)),
        new 防具("闇の衣", 19000, new 範囲(39), new 範囲(0, -39)),
        new 防具("炎の鎧", 22000, 90, 34),
        new 防具("光の鎧", 24000, new 範囲(109, 40), 32),
        new 防具("地獄の鎧", 6000, new 範囲(220, 0, 220), 44),
        new 防具("戦士のﾊﾟｼﾞｬﾏ", 2100, new 範囲(14, 5), new 範囲(0, -19)),
        new 防具("不思議なﾎﾞﾚﾛ", 7777, new 範囲(77, 0, 77), new 範囲(0, -77, 77)),
        new 防具("危ない水着", 12800, new 範囲(0, -29), new 範囲(0, -99)),
        new 防具("神秘の鎧", 25000, new 範囲(119, 70), new 範囲(20, 0, 10)),
        new 防具("ﾄﾞﾗｺﾞﾝﾛｰﾌﾞ", 27000, 100, new 範囲(49)),
        new 防具("天空の鎧", 30000, new 範囲(149, 100), 42),
        new 防具("魔人の鎧", 18000, new 範囲(300, 0, 300), 55),
        new 防具("王者のﾏﾝﾄ", 28000, new 範囲(149), new 範囲(39)),
        new 防具("ﾊｸﾞﾚﾒﾀﾙの鎧", 30000, 150, 45),
        new 防具("古びた鎧", 10, 1, 30),
        new 防具("騎士団の服", 1200, 32, new 範囲(13)),
        new 防具("ｼﾙﾊﾞｰﾒｲﾙ", 2400, 55, 17),
        new 防具("ﾗｲﾄｱｰﾏｰ", 4700, new 範囲(59, 25), 20),
        new 防具("あつでの鎧", 5000, 75, 40),
        new 防具("金の胸当て", 16000, 92, 40),
        new 防具("ﾌﾟﾗﾁﾅﾒｲﾙ", 20000, 95, 38),
        new 防具("盗賊の衣", 14000, new 範囲(19), new 範囲(0, -45, 5)),
        new 防具("紅蓮のﾛｰﾌﾞ", 28000, new 範囲(39), new 範囲(0, -56, 4)),
        new 防具("ﾄﾞﾗｺﾞﾝｱｰﾏｰ", 27000, 90, new 範囲(49)),
        new 防具("ｷﾞｶﾞﾝﾄｱｰﾏｰ", 30000, new 範囲(320, 0, 160), 60),
        new 防具("ﾒﾀﾙｷﾝｸﾞの鎧", 40000, 165, 50),
        new 防具("ﾛﾄの鎧", 50000, 180, 55),
        new 防具("竜神の鎧", 40000, new 範囲(225, 0, 25), new 範囲(70, 0, 5)),
        new 防具("竜神王の鎧", 50000, new 範囲(350, 0, 25), new 範囲(45, 0, 5)),

        // TODO
        new 戦闘時の道具("薬草", 30, (使用者, 対象者) => { new 回復スキル(使用者, 対象者, 属性.道具, 40); }),
        new 戦闘時の道具("上薬草", 100, (使用者, 対象者) => { new 回復スキル(使用者, 対象者, 属性.道具, 100); }),
        new 戦闘時の道具("特薬草", 300, (使用者, 対象者) => { new 回復スキル(使用者, 対象者, 属性.道具, 250); }),
        new 戦闘時の道具("賢者の石", 1500, (使用者) => { new 全体技(使用者, 回復スキル, 1, 属性.道具, 200); }),
        new 戦闘時の道具("世界樹のしずく", 5000, (使用者) => { new 全体技(使用者, 回復スキル, 1, 属性.道具, 999); }),
        new 戦闘時の道具("世界樹の葉", 5000, (使用者, 対象者) => { new 蘇生スキル(使用者, 対象者, 属性.道具, 1); }), // TODO テキスト
        new 戦闘時の道具("毒消し草", 20, (使用者, 対象者) => { new 状態異常回復スキル(使用者, 対象者, 属性.道具, "猛毒"); }),
        new 戦闘時の道具("満月草", 20, (使用者, 対象者) => { new 状態異常回復スキル(使用者, 対象者, 属性.道具, "麻痺"); }),
        new 戦闘時の道具("天使の鈴", 20, (使用者, 対象者) => { new 状態異常回復スキル(使用者, 対象者, 属性.道具, "混乱"); }),
        new 戦闘時の道具("ﾊﾟﾃﾞｷｱの根っこ", 250, (使用者, 対象者) => { new 状態異常回復スキル(使用者, 対象者, 属性.道具); }),
        new 戦闘時の道具("魔法の聖水", 500, (使用者, 対象者) => { new ＭＰ回復スキル(使用者, 対象者, 属性.道具, 40); }),
        new 戦闘時の道具("祈りの指輪", 2000, (使用者, 対象者) => { new ＭＰ回復スキル(使用者, 対象者, 属性.道具, 100); }),
        new 戦闘時の道具("ｴﾙﾌの飲み薬", 8000, (使用者, 対象者) => { new ＭＰ回復スキル(使用者, 対象者, 属性.道具, 999); }),
        new 戦闘時の道具("守りの石", 100, (使用者, 対象者) => { new 一時的状態スキル(使用者, 対象者, 属性.道具, "攻軽減"); }),
        new 戦闘時の道具("魔法の鏡", 300, (使用者, 対象者) => { new 一時的状態スキル(使用者, 対象者, 属性.道具, "魔反撃"); }),

        new ステータスの種("命の木の実", 500, 簡易ステータス.ＨＰ, new 範囲(6, 3)),
        new ステータスの種("不思議な木の実", 500, 簡易ステータス.ＭＰ, new 範囲(6, 3)),
        new ステータスの種("力の種", 500, 簡易ステータス.攻撃力, new 範囲(6, 1)),
        new ステータスの種("守りの種", 500, 簡易ステータス.守備力, new 範囲(6, 1)),
        new ステータスの種("素早さの種", 500, 簡易ステータス.素早さ, new 範囲(6, 1)),

        new 非戦闘時の道具("ｽｷﾙの種", 1000, () => {
          const 増加値 = new 範囲(3, 1).取得();
          あなた.メンバー.現職.SP増減(増加値);
          あなた.チャット書き込み予約(`${あなた}のSPが ${増加値} あがった！`);
          return true;
        }),
        new 非戦闘時の道具("幸せの種", 3000, () => {
          // TODO
          あなた.メンバー.経験値 = あなた.メンバー.レベル * あなた.メンバー.レベル * 10;
          あなた.チャット書き込み予約(`次のクエスト時にレベルアップ！`);
          return true;
        }),
        new 非戦闘時の道具("小さなﾒﾀﾞﾙ", 500, () => {
          あなた.メンバー._小さなメダル.収支(1);
          あなた.チャット書き込み予約("メダル王にメダルを１枚献上しました");
          return true;
        }),

        new 錬金素材("ﾓﾝｽﾀｰ銅貨", 1000),
        new 錬金素材("ﾓﾝｽﾀｰ銀貨", 3000),
        new 錬金素材("ﾓﾝｽﾀｰ金貨", 6000),

        new 転職アイテム("賢者の悟り", 10000),
        new 転職アイテム("勇者の証", 10000),
        new 転職アイテム("邪神像", 10000),
        new 転職アイテム("精霊の守り", 5000),
        new 転職アイテム("伯爵の血", 5000),
        new 転職アイテム("ﾏﾈﾏﾈの心", 5000),
        new 転職アイテム("ｽﾗｲﾑの心", 5000),
        new 転職アイテム("ﾊｸﾞﾚﾒﾀﾙの心", 8000),
        new 転職アイテム("ﾄﾞﾗｺﾞﾝの心", 5000),
        new 転職アイテム("闇のﾛｻﾞﾘｵ", 8000),
        new 転職アイテム("ｷﾞｻﾞｰﾙの野菜", 8000),
        new 転職アイテム("ｸﾎﾟの実", 5000),
        new 転職アイテム("ｷﾞｬﾝﾌﾞﾙﾊｰﾄ", 5000),
        new 転職アイテム("ｼﾞｪﾉﾊﾞ細胞", 10000),

        // TODO
        new 戦闘時の道具("ﾄﾞﾗｺﾞﾝ草", 150),
        new 戦闘時の道具("爆弾石", 300),

        new 変装用の道具("へんげの杖", 1000),
        new 変装用の道具("ﾋﾟﾝｸｽｶｰﾄ", 300, "chr/001.gif"),
        new 変装用の道具("ﾀﾝｸﾄｯﾌﾟﾊﾝﾏｰ", 300, "chr/005.gif"),
        new 変装用の道具("ﾁｮﾋﾞﾋｹﾞﾀｸｼｰﾄﾞ", 300), // TODO 性別で衣装が変わる
        new 変装用の道具("ﾈｺﾐﾐﾒｲﾄﾞ", 300, "chr/004.gif"),
        new 変装用の道具("ﾎﾋﾞｯﾄ", 300, "chr/014.gif"),
        new 変装用の道具("ﾊﾅﾒｶﾞﾈ", 300, "chr/021.gif"),
        new 変装用の道具("ぬいぐるみ", 300, "chr/023.gif"),
        new 変装用の道具("冒険家の衣装", 300, "chr/003.gif", "冒険家"),
        new 変装用の道具("騎士団の衣装", 300, "chr/015.gif", "騎士団"),
        new 変装用の道具("老人の衣装", 300, "chr/013.gif", "老人"),
        new 変装用の道具("精霊の衣装", 300, "chr/011.gif", "精霊"),
        new 変装用の道具("聖職者の衣装", 300, "聖職者"), // TODO 性別で衣装が変わる
        new 変装用の道具("王族の衣装", 300, "王様"), // TODO 性別で衣装が変わる

        new 非戦闘時の道具("ﾌｧｲﾄ一発", 3000, () => {
          あなた.メンバー._疲労 = 0;
          あなた.チャット書き込み予約(`元気全快！${あなた}の疲労が回復した！`);
        }),
        new 非戦闘時の道具("ｴｯﾁな本", 100, () => {
          あなた.メンバー._アイコン = 職業.一覧("遊び人").アイコン名を取得(性別);
          あなた._めっせーじ = "性格：ムッツリスケベ";
          あなた.チャット書き込み予約(`${あなた}はｴｯﾁな本をじっくり読んだ………<br />${あなた}の性格がムッツリスケベになった！`);
          ニュース.書き込み(`<span class="whisper">＠ささやき>全員 ${あなた}がムッツリスケベになりました！</span>`);
          // TODO プロフィールのキャラクターをムッツリスケベに
        }),
        new 非戦闘時の道具("天馬のたづな", 20000, () => {
          // TODO 多分チャット書かれない 
          あなた.チャット書き込み予約(`${あなた}は、天馬に乗り天界へと導かれた！`);
          あなた.場所移動(場所.一覧("天界"));
        }),

        new オーブ("ｼﾙﾊﾞｰｵｰﾌﾞ", 1000),
        new オーブ("ﾚｯﾄﾞｵｰﾌﾞ", 1000),
        new オーブ("ﾌﾞﾙｰｵｰﾌﾞ", 1000),
        new オーブ("ｸﾞﾘｰﾝｵｰﾌﾞ", 1000),
        new オーブ("ｲｴﾛｰｵｰﾌﾞ", 1000),
        new オーブ("ﾊﾟｰﾌﾟﾙｵｰﾌﾞ", 1000),

        new ステージ変更の道具("ﾗｰの鏡", 5000, 15),
        new ステージ変更の道具("ﾏﾀﾞﾑの招待状", 5000, 16),
        new ステージ変更の道具("宝の地図", 5000, 17),
        new ステージ変更の道具("闇のﾗﾝﾌﾟ", 5000, 18),
        new ステージ変更の道具("闇のｵｰﾌﾞ", 5000, 19),
        new ステージ変更の道具("天空の盾と兜", 5000, 20, () => あなた.武器名 === "天空の剣" && あなた.防具名 === "天空の鎧"),

        new 味方召喚用の道具("身代わり人形", 800, new NPCの味方("item/001.gif", 150, 999, 400, 50, 150)),
        new 味方召喚用の道具("身代わり石像", 1000, new NPCの味方("item/002.gif", 120, 300, 700, 900, 100)),
        new 味方召喚用の道具("身代わり騎士", 1200, new NPCの味方("item/003.gif", 300, 100, 999, 200, 100)),

        // TODO
        new 戦闘時の道具("妖精の笛"),
        new 戦闘時の道具("戦いのﾄﾞﾗﾑ"),
        new 戦闘時の道具("魔物のｴｻ"),
        new 戦闘時の道具("銀のたてごと"),
        new 戦闘時の道具("竜のｳﾛｺ"),
        new 戦闘時の道具("守りのﾙﾋﾞｰ"),
        new 戦闘時の道具("魔法の粉"),
        new 戦闘時の道具("悪魔の粉"),
        new 戦闘時の道具("ｷﾒﾗの翼"),
        new 戦闘時の道具("魔石のｶｹﾗ"),
        new 戦闘時の道具("悪魔のしっぽ"),
        new 戦闘時の道具("不思議なﾀﾝﾊﾞﾘﾝ"),
        new 戦闘時の道具("時の砂"),

        new 転職アイテム("魔銃", 5000),
        new 転職アイテム("禁じられた果実", 7000),
        new 転職アイテム("ｽﾗｲﾑﾋﾟｱｽ", 20000),
        new 転職アイテム("飛竜のﾋｹﾞ", 20000),
        new 転職アイテム("禁断の書", 18000),
        new 転職アイテム("ｺｳﾓﾘの羽", 15000),
        new 転職アイテム("ﾏｼﾞｯｸﾏｯｼｭﾙｰﾑ", 20000),
        new 転職アイテム("透明ﾏﾝﾄ", 20000),
        new 転職アイテム("獣の血", 18000),
        new 転職アイテム("死者の骨", 18000),
        new 転職アイテム("謎の液体", 15000),
        new 転職アイテム("ﾋｰﾛｰｿｰﾄﾞ", 20000),
        new 転職アイテム("ﾋｰﾛｰｿｰﾄﾞ2", 20000),

        // TODO
        new 戦闘時の道具("小人のﾊﾟﾝ", 950),
        new 戦闘時の道具("ﾘｼﾞｪﾈﾎﾟｰｼｮﾝ", 700),
        new 戦闘時の道具("復活の草", 2000),

        new ステージ変更の道具("次元のｶｹﾗ", 5000, 21),

        // TODO
        new 道具("幸せのくつ", 777),
        new 道具("金の鶏", 7000),
        new 道具("宝物庫の鍵"),

        new 転職アイテム("ﾁｮｺﾎﾞの羽", 20000),
        new 転職アイテム("ｲﾝﾃﾘﾒｶﾞﾈ", 10000),

        // TODO 戦闘システム作ってからじゃないとタイミングが不明
        new 装備系道具("ﾒｶﾞﾝﾃの腕輪", 500, undefined, (戦闘メンバー) => {
          // TODO
        }),
        new 装備系道具("幸せの帽子", 777, undefined, (戦闘メンバー) => {
          if (戦闘メンバー.は死んでいる())
            return;
          戦闘メンバー.ステータス.ＭＰ.現在値 += 整数乱数(13, 9, true);
        }),
        new 装備系道具("命の指輪", 1200, undefined, (戦闘メンバー) => {
          if (戦闘メンバー.は死んでいる())
            return;
          戦闘メンバー.ステータス.ＨＰ.現在値 += 整数乱数(17, 9, true);
        }),

        // TODO 以下2つはモシャス等後効果なし
        new 装備系道具("命のﾌﾞﾚｽﾚｯﾄ", 1100, ステータス.ＨＰ(100)),
        new 装備系道具("ｿｰｻﾘｰﾘﾝｸﾞ", 2000, ステータス.ＭＰ(100)),

        new 装備系道具("怒りのﾀﾄｩｰ", 2000, undefined, (戦闘メンバー) => {
          if (確率(2 / 3)) {
            return;
          }
          // TODO テンションの定義
          戦闘メンバー.テンション = 1.7;
          戦闘メンバー.一時的状態 = "２倍";
        }),
        new 装備系道具("ﾄﾞｸﾛの指輪", 666, new ステータス(0, 0, 30, 0, 30), (戦闘メンバー) => {
          戦闘メンバー.状態異常("動封");
        }),
        new 装備系道具("金のﾛｻﾞﾘｵ", 1100, ステータス.守備力(30)),
        new 装備系道具("金の指輪", 800, ステータス.守備力(15)),
        new 装備系道具("金のﾌﾞﾚｽﾚｯﾄ", 1500, ステータス.守備力(50)),
        new 装備系道具("はやてのﾘﾝｸﾞ", 1500, ステータス.素早さ(30)),
        new 装備系道具("ほしふる腕輪", 3000, ステータス.素早さ(60)),
        new 装備系道具("力の指輪", 1500, ステータス.攻撃力(20)),
        new 装備系道具("ごうけつの腕輪", 3000, ステータス.攻撃力(40)),
        new 装備系道具("ｱﾙｺﾞﾝﾘﾝｸﾞ", 6000, new ステータス(0, 0, 30, 0, 30)),

        // TODO 中身
        new 福袋("福袋", 1000, [1, 1, 1, 1, 1, 1, 7, 7, 8, 9, 10,]),
        new 福袋("幸福袋", 7000, [128, 129, 130, 131, 132, 133, 134, 128, 129, 130, 131, 132, 133, 134, 135, 136]),

        new 未読錬金レシピ("基本錬金ﾚｼﾋﾟ", 500, 0),
        new 未読錬金レシピ("応用錬金ﾚｼﾋﾟ", 2000, 1),
        new 未読錬金レシピ("神の錬金ﾚｼﾋﾟ", 7000, Infinity),

        new 非戦闘時の道具("馬のﾌﾝ", 1, () => { あなた.チャット書き込み予約(`${あなた}は馬のﾌﾝをにぎりしめた！………${あなた}は後悔した…`); return true; }),
        new 錬金素材("魔獣の皮", 500),
        new 錬金素材("魔除けの聖印", 800),
        new 錬金素材("聖者の灰", 1200),
        new 錬金素材("金塊", 10000),
        new 錬金素材("ｽﾗｲﾑの冠", 15000),
        new 錬金素材("ｵﾘﾊﾙｺﾝ", 20000),
        new 錬金素材("ﾛﾄの印", 30000),

        new 変装用の道具("ﾀｸｼｰﾄﾞ", "chr/027.gif", 500),
        new 変装用の道具("闇人の衣装", 600, "chr/025.gif", "闇人"),
        new 変装用の道具("英雄の衣装", 700, "英雄"), // TODO 性別に応じ
        new 変装用の道具("ﾓｼｬｽの巻物", 1500) // TODO ランダム
      ].map((_アイテム) => { アイテム.#IDから.set(_アイテム.ID, _アイテム); return [_アイテム.名前, _アイテム]; }, アイテム));
      // console.log(`アイテム総数: ${this.#一覧.size} 個(「なし」含む)`);
    }

    static 一覧(アイテム名, エラーを出す = true) {
      return this.#一覧.get(アイテム名) ?? ((!エラーを出す || console.error(`アイテム「${アイテム名}」は存在しません`)) ? undefined : undefined);
    }

    static IDから(ID) {
      return アイテム.#IDから.get(ID);
    }

    static リスト(アイテム名リスト) {
      return new Set(アイテム名リスト.map(アイテム.一覧, アイテム));
    }

    _図鑑用出力(...出力) {
      return super._陳列用出力(undefined, 出力);
    }

    #ID;

    static #一覧;
    static #自動ID = 0;
    static #IDから;
  }

  class 武具インターフェース extends アイテム {
    constructor(名前, 価値, 強さ, 重さ) {
      super(名前, 価値);
      this.#強さ = 強さ;
      this.#重さ = 重さ;
    }

    使う() {
      通知欄.追加(this.ステータスを出力());
    }

    ステータスを出力(装備部位名 = this.constructor.name) {
      return `${装備部位名}名：${this.名前} / 強さ：<b>${this.強さ}</b> / 重さ：<b>${this.重さ}</b> / 価格：<b>${this.価値}</b>G`;
    }

    _陳列用出力(クリック時のこうどう名, 価格係数 = 1) {
      // TODO 強さ重さ価格は右揃え
      return super._陳列用出力(クリック時のこうどう名, this.名前, `${this.価値 * 価格係数} G`, this.強さ, this.重さ);
    }

    _図鑑用出力() {
      // TODO 強さ重さ価格は右揃え
      return super._図鑑用出力(this.名前, this.強さ, this.重さ, `${this.価値} G`);
    }

    get 強さ() { return this.#強さ.ランダム取得?.() ?? this.#強さ; }
    get 重さ() { return this.#重さ.ランダム取得?.() ?? this.#重さ; }

    static _陳列用ヘッダー項目名リスト = ["名前", "値段", "強さ", "重さ"];
    static _図鑑用ヘッダー項目名リスト = ["名前", "強さ", "重さ", "価格"];

    #強さ;
    #重さ;
  }

  class 武器 extends 武具インターフェース {
    名前と個数出力(個数) {
      return アイテム.名前と個数出力(個数, "本", this.名前);
    }

    ステータスへ() {
      return new ステータス(0, 0, this._強さ, 0, -this._重さ);
    }
  }

  class 防具 extends 武具インターフェース {
    名前と個数出力(個数) {
      return アイテム.名前と個数出力(個数, "着", this.名前);
    }

    ステータスへ() {
      return new ステータス(0, 0, 0, this._強さ, -this._重さ);
    }
  }

  class 道具 extends アイテム {
    名前と個数出力(個数) {
      return アイテム.名前と個数出力(個数, "個", this.名前);
    }

    使う() {
      通知欄.追加(`${this.名前}はここでは使えません`);
      return false;
    }

    _陳列用出力(クリック時のこうどう名, 価格係数 = 1) {
      // TODO 価格は右揃え
      return super._陳列用出力(クリック時のこうどう名, this.名前, `${this.価値 * 価格係数} G`);
    }

    _図鑑用出力() {
      // TODO 価格は右揃え
      return super._図鑑用出力(this.名前, `${this.価値} G`);
    }

    static _陳列用ヘッダー項目名リスト = ["名前", "価格"];
    static _図鑑用ヘッダー項目名リスト = ["名前", "価格"];
  }

  class 使用可能な道具インターフェース extends 道具 {
    constructor(名前, 価値, 効果) {
      super(名前, 価値);
      if (効果 !== undefined)
        this._効果 = 効果;
    }
  }

  class 非戦闘時の道具 extends 使用可能な道具インターフェース {
    使う(タイミング) {
      if (タイミング !== 道具.タイミング.非戦闘時) {
        // TODO
        super.使う();
        return false;
      }
      // 確認(home.cgi)
      あなた.チャット書き込み予約(`${this.名前}をつかった！`);
      return this._効果();
    }
  }

  class ステータスの種 extends 非戦闘時の道具 {
    constructor(名前, 価値, 成長ステータス, 範囲) {
      super(名前, 価値);
      console.log();
      this.#成長ステータス名 = 成長ステータス.name;
      this.#成長ステータス = 成長ステータス;
      this.#範囲 = 範囲;
    }

    _効果() {
      // TODO 確認
      console.log(this.#成長ステータス.name);
      const 増加値 = this.#成長ステータス(this.#範囲.ランダム取得());
      あなた.ステータス.増減(増加値);
      あなた.チャット書き込み予約(`${あなた}の${this.#成長ステータス名}が ${増加値} あがった！`);
      return true;
    }

    #成長ステータス名;
    #成長ステータス;
    #範囲;
  }

  class 変装用の道具 extends 非戦闘時の道具 {
    constructor(名前, 価値, アイコン名, 姿の名前 = 名前) {
      super(名前, 価値);
      this.#アイコン名 = アイコン名;
      this.#姿の名前 = 姿の名前;
    }

    _効果() {
      あなた.メンバー._アイコン = this.#アイコン名;
      あなた.チャット書き込み予約(`${あなた}は${this.#姿の名前}のコスプレをした！`);
      return true;
    }

    #アイコン名;
    #姿の名前;
  }

  class オーブ extends 非戦闘時の道具 {
    constructor(名前, 価値) {
      super(名前, 価値);
    }

    _効果() {
      if (あなた.オーブを捧げる(this)) {
        あなた.チャット書き込み予約(`${this.名前}を復活の祭壇にささげた！`);
        return true;
      }
      else {
        通知欄.追加("すでにささげられています");
        return false;
      }
    }
  }

  class 福袋 extends 非戦闘時の道具 {
    constructor(名前, 価値, 中身名候補リスト) {
      super(名前, 価値);
      this.#中身名候補リスト = 中身名候補リスト;
    }

    _効果() {
      const 中身名 = ランダムな1要素(this.#中身名候補リスト);
      あなた.現在地.NPCに話させる(`なんと、${this.名前}の中身は ${中身名} だった！`);
      あなた.倉庫にアイテムを送る(中身名);
      return true;
    }

    #中身名候補リスト;
  }

  class 未読錬金レシピ extends 非戦闘時の道具 {
    constructor(名前, 価値, 難易度) {
      super(名前, 価値);
      this.#難易度 = 難易度;
    }

    _効果() {
      あなた.錬金レシピを登録(this.#難易度);
      return true;
    }

    #難易度;
  }

  class 戦闘時の道具 extends 使用可能な道具インターフェース {
    使う(タイミング, 対象) {
      if (タイミング !== 道具.タイミング.戦闘時) {
        // 確認(home.cgi)
        通知欄.追加(`${this.名前}は戦闘中でしか使えません`);
        return false;
      }
      return this._効果(対象);
    }
  }

  class ステージ変更の道具 extends 戦闘時の道具 {
    constructor(名前, 価値, ステージ番号, 追加条件) {
      super(名前, 価値)
      this.#ステージ番号 = ステージ番号;
      this.#追加条件 = 追加条件;
    }

    _効果() {
      if (vsモンスターでない || (this.#追加条件 && !this.#追加条件())) {
        通知欄.追加("しかし、何も起こらなかった…");
        return false;
      }
      あなた.クエスト.ステージ変更(this.#ステージ番号);
      return true;
    }

    #ステージ番号;
    #追加条件;
  }

  class 味方召喚用の道具 extends 戦闘時の道具 {
    constructor(名前, 価値, 召喚用データ) {
      super(名前, 価値);
      this.#召喚用データ = 召喚用データ;
    }

    _効果(使用者, 対象者) {
      if (あなた.クエスト.戦闘メンバー.一覧(味方召喚用の道具.#キャラクター名)) {
        あなた.チャット書き込み予約(`しかし、${this.名前}は消滅した…`);
      }
      else {
        使用者.現在地.メンバーを追加(召喚用データ.戦闘メンバーとして取得(味方召喚用の道具.#キャラクター名, 使用者));
      }
      return true;
    }

    #召喚用データ;

    static #キャラクター名 = "@ﾀﾞﾐｰ@";
  }

  class 装備系道具 extends 道具 {
    constructor(名前, 価値, ステータス, 追加効果) {
      super(名前, 価値);
      this.#ステータス = ステータス;
      this.#追加効果 = 追加効果;
    }

    _効果(戦闘メンバー) {
      if (this.#ステータス !== undefined) {
        戦闘メンバー.ステータス.増減(this.#ステータス);
      }
      this.#追加効果?.(戦闘メンバー);
      return true;
    }

    #ステータス;
    #追加効果;
  }

  class 錬金素材 extends 道具 {
    // とりあえず定義
  }

  class 転職アイテム extends 道具 {
    // とりあえず定義
  }

  class 進む人のステータス依存 {
    constructor(ステータス名, 倍率, 現在ステータスを参照する = false) {
      this.#ステータス名 = ステータス名;
      this.#倍率 = 倍率;
      // デフォルトに忠実
      this.#現在ステータスを参照する = 現在ステータスを参照する;
    }

    ランダム取得() {
      const ステータス = あなた.メンバー.ステータス[this.#ステータス名];
      return 整数乱数((
        (this.#現在ステータスを参照する) ? ステータス.現在値
          : ステータス.基礎値)
        * this.#倍率);
    }

    #ステータス名;
    #倍率;
    #現在ステータスを参照する;
  }

  class アイテム範囲 extends 範囲 {
    ランダム取得() {
      return アイテム.IDから(super.ランダム取得());
    }

    *[Symbol.iterator]() {
      for (const ID of super[Symbol.iterator]()) {
        yield アイテム.IDから(ID);
      }
    }
  }

  class アイテム名前範囲 extends 範囲 {
    ランダム取得() {
      return アイテム.IDから(super.ランダム取得());
    }

    *[Symbol.iterator]() {
      for (const ID of super[Symbol.iterator]()) {
        yield アイテム.IDから(ID).名前;
      }
    }
  }

  class アイテム連続 extends 連続 {
    *[Symbol.iterator]() {
      for (const ID of super[Symbol.iterator]()) {
        yield アイテム.IDから(ID);
      }
    }
  }

  // class 装備スロット {
  //   constructor(メンバーID) {
  //     this.#メンバーID = メンバーID;
  //   }

  //   async 装備(アイテム名, アイテム図鑑に登録する = true) {
  //     await データベ�������ス操作.アイテム倉庫に存在するか確認する(アイテム名);
  //     if (this._装備名) { }
  //     await データベース操作.アイテム図鑑に登録する(アイテム名);
  //     const 元々のアイテム名 = this._装備名;
  //     return true;
  //   }

  //   外す(アイテム種類) {
  //     this.#装備 = undefined;
  //   }

  //   売る() {

  //   }

  //   は空() {
  //     return this.#装備 === undefined;
  //   }

  //   #メンバーID;
  //   _装備名;
  //   #装備;
  // }

  class 壁紙 extends 陳列可能インターフェース {
    constructor(画像, 価値) {
      super(画像.match(壁紙.#拡張子を除く)[0]);
      this.#画像 = 画像;
      this.#価値 = 価値;
    }

    get 価値() { return this.#価値; }

    _陳列用出力() {
      // デフォルトに忠実
      const
        td = document.createElement("td"),
        div = document.createElement("div"),
        span = document.createElement("span"),
        img = document.createElement("img");
      td.classList.add("壁紙一覧-td");
      span.classList.add("壁紙一覧-内容");
      img.src = `resource/bg/${this.#画像}`;
      img.title = this.名前;
      span.append(img, `${this.#価値} G`);
      td.appendChild(span);
      チャットフォーム.文字列追加イベントを登録(span, `＠かべがみ>${this.名前} `);
      return td;
    }

    static 陳列棚出力() {
      const table = document.createElement("table");
      table.classList.add("壁紙陳列棚");
      let
        tr,
        改行する = 0;
      for (const 壁紙 of this.#一覧.values()) {
        if (++改行する % 10 === 1) {
          tr = document.createElement("tr");
          table.appendChild(tr);
        }
        tr.appendChild(壁紙._陳列用出力());
      }
      return table;
    }

    static 初期化() {
      this.#一覧 = new Map([
        // Perlのソートアルゴリズムは同値の時に順番を維持するとは限らないので、
        // 必ず維持するJavascriptと順番が違う場合があります
        // 気になるならリストの順番を入れ変えてください

        new 壁紙("none.gif", 0),

        new 壁紙("farm.gif", 1000),
        new 壁紙("lot.gif", 1000),
        new 壁紙("sp_change.gif", 1500),
        new 壁紙("exile.gif", 1500),
        new 壁紙("depot.gif", 1500),
        new 壁紙("item.gif", 2000),
        new 壁紙("medal.gif", 2000),
        new 壁紙("bar.gif", 2500),
        new 壁紙("casino.gif", 2500),
        new 壁紙("goods.gif", 2500),
        new 壁紙("armor.gif", 3000),
        new 壁紙("job_change.gif", 3000),
        new 壁紙("park.gif", 3500),
        new 壁紙("auction.gif", 4000),
        new 壁紙("weapon.gif", 5000),
        new 壁紙("event.gif", 5000),

        new 壁紙("stage0.gif", 6000),
        new 壁紙("stage1.gif", 6500),
        new 壁紙("stage2.gif", 7000),
        new 壁紙("stage3.gif", 7500),
        new 壁紙("stage4.gif", 8000),
        new 壁紙("stage5.gif", 8500),
        new 壁紙("stage6.gif", 9000),
        new 壁紙("stage7.gif", 9500),
        new 壁紙("stage8.gif", 10000),
        new 壁紙("stage9.gif", 10500),
        new 壁紙("stage10.gif", 11000),
        new 壁紙("stage11.gif", 11500),
        new 壁紙("stage12.gif", 12000),
        new 壁紙("stage13.gif", 12500),
        new 壁紙("stage14.gif", 13000),
        new 壁紙("stage15.gif", 20000),
        new 壁紙("stage16.gif", 22000),
        new 壁紙("stage17.gif", 24000),
        new 壁紙("stage18.gif", 25000),
        new 壁紙("stage19.gif", 30000),
        new 壁紙("stage20.gif", 50000),

        new 壁紙("map1.gif", 3000),
        new 壁紙("map2.gif", 4500),
        new 壁紙("map3.gif", 5000)
      ].sort((壁紙1, 壁紙2) => 壁紙1.#価値 - 壁紙2.#価値).map((壁紙) => [壁紙.名前, 壁紙]));
    }

    static 一覧(画像名, エラーを出す = true) {
      return this.#一覧.get(画像名) ?? ((!エラーを出す || console.error(`壁紙「${画像名}」は存在しません`)) ? undefined : undefined);
    }

    #画像;
    #価値;

    static #一覧;
    static #拡張子を除く = new RegExp(/.+(?=[.].+)/);
  }

  class 一時的な場所 {

  }

  class 戦闘 extends 場所 {
    constructor() {
      super("none.gif", 場所._訪問方法.特殊);
      this._こうどうリストリスト = [一般的な場所._一般的なこうどう];
    }

    メンバー出力() {

    }
  }

  class 冒険場所の情報 {
    constructor(名前, 背景画像, 宝の中身, ボスリスト, 雑魚リスト) {

    }

    static 初期化() {
      クエスト情報.初期化();
      ダンジョン情報.初期化();
    }
  }

  class クエスト情報 extends 冒険場所の情報 {
    static 初期化() {
      new クエスト情報("プニプニ平原", "stage0.gif", [
        [...アイテム.名前範囲("ひのきの棒", "おおきづち")],
        [...アイテム.名前範囲("布の服", "鎖かたびら")],
        [
          undefined,
          ...new 連続("薬草", 2),
          ...new 連続("上薬草", 2),
          ...アイテム.名前範囲("毒消し草", "天使の鈴"),
          "守りの石",
          ...アイテム.名前範囲("力の種", "素早さの種"),
          "小さなﾒﾀﾞﾙ", "ﾓﾝｽﾀｰ銅貨", "ﾄﾞﾗｺﾞﾝ草", "身代わり人形"
        ]
      ], [
        new 敵情報(undefined, "ﾋﾞｯｸｽﾗｲﾑ", 300, 0, 35, 10, 40, "006", 60, 20)
      ], [
        new 敵情報(6, "ﾌﾞﾁｽﾗｲﾑ", 5, 0, 7, 0, 7, "001", 1, 2),
        new 敵情報(5, "ｽﾗｲﾑ", 7, 0, 11, 0, 9, "002", 2, 2),
        new 敵情報(3, "ｽﾗｲﾑﾍﾞｽ", 8, 0, 15, 0, 10, "003", 3, 2),
        new 敵情報(1, "ﾁﾋﾞｲｴﾃｨ", 11, 0, 12, 0, 20, "200", 4, 2,),
        new 敵情報(1, "ﾄﾞﾗｷｰ", 10, 0, 15, 0, 24, "025", 5, 3, { 命中率: 70, 状態異常名: "混乱" }),
        new 敵情報(1, "ﾋﾟﾖｺ", 12, 0, 12, 0, 16, "120", 6, 4)
      ]);
      new クエスト情報("キノコの森", "stage1.gif", [
        [...アイテム.名前範囲("こんぼう", "銅の剣")],
        [...アイテム.名前範囲("ｽﾃﾃｺﾊﾟﾝﾂ", "ｽﾗｲﾑの服")],
        [
          undefined,
          ...アイテム.名前範囲("薬草", "特薬草"), ...アイテム.名前範囲("薬草", "特薬草"),
          ...アイテム.名前範囲("毒消し草", "魔法の聖水"), ...アイテム.名前範囲("毒消し草", "魔法の聖水"),
          ...アイテム.名前範囲("力の種", "ｽｷﾙの種"),
          "小さなﾒﾀﾞﾙ", "ﾓﾝｽﾀｰ銅貨", "ﾄﾞﾗｺﾞﾝ草", "爆弾石", "竜のｳﾛｺ", "守りのﾙﾋﾞｰ"
        ]
      ], [
        new 敵情報(undefined, "ﾄﾞｸｷﾉｺA", 30, 29, 20, 10, 11, "031", 15, 12, "猛毒系", 10),
        new 敵情報(undefined, "人面樹", 500, 63, 40, 20, 25, "503", 90, 60, "商人", 20),
        new 敵情報(undefined, "ﾄﾞｸｷﾉｺB", 30, 29, 20, 10, 11, "031", 15, 12, "猛毒系", 10)
      ], [
        new 敵情報(3, "ﾅｽﾋﾞｰﾗ", 140, 0, 16, 0, 25, "050", 4, 4),
        new 敵情報(4, "ｵﾊﾞｹｷﾉｺ", 15, 0, 18, 9, 12, "030", 5, 4),
        new 敵情報(3, "ﾄﾞｸｷﾉｺ", 18, 29, 14, 8, 10, "031", 6, 7, "猛毒系", 10),
        new 敵情報(1, "ﾍﾞﾋﾞｰﾊﾟﾝｻｰ", 20, 0, 22, 7, 24, "206", 8, 3),
        new 敵情報(2, "ﾄﾞﾗｷｰ", 15, 0, 20, 0, 35, "025", 5, 3, { 命中率: 70, 状態異常: "混乱" }),
        new 敵情報(2, "ｽﾗｲﾑ", 10, 0, 11, 0, 16, "002", 3, 2),
        new 敵情報(1, "ｵﾊﾞｹｶﾎﾞﾁｬ", 18, 0, 20, 18, 5, "038", 10, 10)
      ]);
      new クエスト情報("幽霊城", "stage2.gif", [
        [...アイテム.名前範囲("いばらのむち", "ﾙｰﾝｽﾀｯﾌ")],
        [...アイテム.名前範囲("皮の鎧", "青銅の鎧")],
        [
          undefined,
          ...new 連続("ﾊﾟﾃﾞｷｱの根っこ", 2),
          ...new 連続("魔法の聖水", 2),
          "守りの石", "魔法の鏡",
          ...アイテム.名前範囲("守りの石", "ﾓﾝｽﾀｰ銀貨"),
          "ﾄﾞﾗｺﾞﾝ草", "爆弾石",
          ...アイテム.名前範囲("銀のたてごと", "魔石のｶｹﾗ")
        ]
      ], [
        new 敵情報(undefined, "亡霊剣士", 1000, 45, 60, 20, 50, "500", 160, 50, "剣士", 10, { 命中率: 150, 一時的状態: "攻反撃" })
      ], [
        new 敵情報(4, "ｺﾞｰｽﾄ", 20, 0, 36, 20, 30, "035", 7, 4),
        new 敵情報(3, "ﾒｲｼﾞｺﾞｰｽﾄ", 26, 35, 32, 26, 36, "036", 12, 6, "魔法使い", 8),
        new 敵情報(3, "ｼｬﾄﾞｰ", 21, 33, 20, 35, 44, "046", 11, 5, "ﾄﾞﾗｺﾞﾝ", 10),
        new 敵情報(3, "ﾐｲﾗ男", 50, 37, 40, 6, 16, "040", 10, 7, "盗賊", 6),
        new 敵情報(3, "ｶﾞｲｺﾂ剣士", 45, 20, 50, 15, 20, "043", 12, 6, "剣士", 10),
        new 敵情報(3, "ﾅｲﾄｳｨｽﾌﾟ", 25, 45, 30, 25, 35, "070", 9, 5, "闇魔道士", 4),
        new 敵情報(2, "ﾁﾋﾞﾍﾞﾛｽ", 41, 0, 31, 8, 61, "203", 8, 4),
        new 敵情報(1, "ﾊﾟﾝﾌﾟｷﾝ", 65, 0, 55, 20, 14, "039", 16, 8),
        new 敵情報(1, "人食い箱", 120, 42, 55, 10, 200, "090", 30, 50, "眠り系", 30, { 一時的状態: "２倍" }),
      ]);
      new クエスト情報("海辺の洞窟", "stage3.gif", [
        [...アイテム.名前範囲("こんぼう", "どくばり")],
        [...アイテム.名前範囲("うろこの鎧", "ｿﾞﾝﾋﾞﾒｲﾙ")],
        [
          undefined,
          ...new 連続("ﾊﾟﾃﾞｷｱの根っこ", 2),
          ... new 連続("魔法の聖水", 2),
          ...アイテム.名前範囲("守りの石", "ﾓﾝｽﾀｰ銀貨"),
          "ﾄﾞﾗｺﾞﾝ草", "爆弾石", "身代わり人形",
          ...アイテム.名前範囲("銀のたてごと", "魔石のｶｹﾗ")
        ]
      ], [
        new 敵情報(undefined, "ｷﾗｰｼｪﾙ", 450, 50, 90, 90, 30, "215", 100, 150, "戦士", 30, { 命中率: 150, 一時的状態: "魔反撃" }),
        new 敵情報(undefined, "ﾃﾞﾋﾞﾙｼｪﾙ", 1000, 100, 60, 50, 30, "506", 120, 200, "僧侶", 12, { 命中率: 150, 一時的状態: "魔反撃" })
      ], [
        new 敵情報(1, "ﾎｲﾐｽﾗｲﾑ", 50, 45, 30, 15, 50, "010", 14, 5, "僧侶", 6),
        new 敵情報(1, "しびれｸﾗｹﾞ", 60, 31, 36, 18, 35, "012", 13, 6, "麻痺系", 20),
        new 敵情報(1, "ｽﾗｲﾑつむり", 40, 43, 20, 80, 20, "015", 16, 9, "ｽﾗｲﾑ", 7),
        new 敵情報(1, "ﾒｲｼﾞﾄﾞﾗｷｰ", 54, 59, 40, 20, 75, "026", 14, 6, "ｽﾗｲﾑ", 4),
        new 敵情報(1, "亀戦士", 48, 15, 64, 70, 5, "217", 13, 4, "戦士", 10, "無職", 30),
        new 敵情報(1, "ﾁﾋﾞｲｴﾃｨ", 64, 0, 46, 15, 80, "200", 7, 3),
        new 敵情報(1, "ｲｴﾃｨ", 150, 24, 78, 25, 22, "201", 20, 8, "羊飼い", 10, { 状態異常: "眠り" })
      ]);
      new クエスト情報("地獄の砂浜", "stage4.gif", [
        [...アイテム.名前範囲("いばらのむち", "ｿﾞﾝﾋﾞｷﾗｰ")],
        [...アイテム.名前範囲("毛皮のﾏﾝﾄ", "ﾃﾞﾋﾞﾙｱｰﾏｰ")],
        [
          undefined, "上薬草",
          ... new 連続("特薬草", 2),
          ...アイテム.名前範囲("守りの石", "ﾓﾝｽﾀｰ金貨"),
          "身代わり人形", "身代わり石像",
          ...アイテム.名前範囲("銀のたてごと", "魔石のｶｹﾗ")
        ]
      ], [
        new 敵情報(undefined, "ｺﾞｰﾚﾑ", 1500, 77, 100, 60, 50, "546", 150, 100, "風水士", 10, "無職", 20, { 命中率: 150, 一時的状態: "攻軽減" }),
      ], [
        new 敵情報(3, "ﾏｯﾄﾞﾊﾝﾄﾞ", 70, 50, 85, 36, 50, "063", 10, 8, "召喚系", 10),
        new 敵情報(3, "おおさそり", 34, 19, 76, 130, 45, "052", 11, 9, "麻痺系", 10, "無職", 30),
        new 敵情報(2, "ﾎﾞﾑ", 50, 42, 50, 60, 50, "071", 15, 10, "悪魔", 10),
        new 敵情報(1, "まどうし", 55, 66, 35, 30, 70, "060", 16, 6, "ｽﾗｲﾑ", 3),
        new 敵情報(2, "ｻﾎﾞﾃﾝﾀﾞｰ", 100, 50, 70, 50, 150, "058", 20, 5, "踊り子", 16),
        new 敵情報(2, "ｱｶﾃﾝﾀﾞｰ", 100, 50, 70, 50, 150, "059", 20, 5, "踊り子", 16),
        new 敵情報(2, "ﾄｹﾞﾎﾞｳｽﾞ", 64, 24, 55, 125, 15, "212", 23, 7, "ﾊﾞｰｻｰｶｰ", 10),
        new 敵情報(2, "ﾁﾋﾞﾍﾞﾘｰ", 50, 16, 55, 15, 120, "198", 15, 5, "魔物使い", 5, "無職"),
        new 敵情報(1, "ﾍﾞﾛﾛﾝ", 120, 34, 85, 40, 10, "199", 28, 10, "魔物使い", 50),
        new 敵情報(1, "ﾁﾋﾞﾄﾞﾗｺﾞﾝ", 150, 14, 85, 35, 20, "083", 24, 7, "魔物使い", 5)
      ]);
      new クエスト情報("魔術師の塔", "stage5.gif", [
        [...アイテム.名前範囲("銅の剣", "ﾊﾞﾄﾙｱｯｸｽ")],
        [...アイテム.名前範囲("うろこの鎧", "鋼鉄の鎧")],
        [
          undefined, "特薬草", "賢者の石",
          ...アイテム.名前範囲("魔法の鏡", "ﾓﾝｽﾀｰ金貨"),
          "ﾄﾞﾗｺﾞﾝ草", "爆弾石",
          new 連続("へんげの杖", 3),
          ...アイテム.名前範囲("身代わり人形", "不思議なﾀﾝﾊﾞﾘﾝ")
        ]
      ], [
        new 敵情報(undefined, "闇の魔術士", 1400, 250, 70, 20, 100, "510", 180, 120, "ﾊｸﾞﾚﾒﾀﾙ", 25, { 命中率: 150, 一時的状態: "魔軽減" }),
        new 敵情報(undefined, "魔法使い", 144, 72, 50, 45, 76, "061", 24, 9, "魔法使い", 14),
        new 敵情報(undefined, "ｽﾗｲﾑまどう", 160, 84, 45, 30, 100, "013", 26, 8, "闇魔道士", 16)
      ], [
        new 敵情報(5, "まどうし", 55, 66, 45, 40, 70, "060", 18, 6, "ｽﾗｲﾑ", 3),
        new 敵情報(4, "魔法使い", 67, 90, 40, 45, 76, "061", 20, 9, "魔法使い", 14),
        new 敵情報(4, "ｽﾗｲﾑまどう", 70, 104, 35, 30, 100, "013", 19, 8, "闇魔道士", 16),
        new 敵情報(3, "ﾃﾞﾋﾞﾙｴｯｸﾞ", 66, 66, 66, 66, 66, "065", 1, 6, "商人", 10, "無職", 30),
        new 敵情報(3, "ﾐﾆﾃﾞｰﾓﾝ", 124, 16, 64, 35, 110, "066", 15, 6, "遊び人", 26),
        new 敵情報(3, "おおめだま", 90, 34, 78, 55, 60, "077", 21, 8, "闇魔道士", 16),
        new 敵情報(3, "ｽﾍﾟｸﾃｯﾄﾞ", 100, 44, 65, 50, 64, "078", 20, 11, "結界士", 50),
        new 敵情報(1, "ﾋﾞｯｸﾞﾄﾞﾗｷｰ", 180, 24, 98, 10, 180, "258", 40, 8, "結界士", 30, { 状態異常: "混乱" }),
        new 敵情報(1, "ﾐﾐｯｸ", 300, 68, 100, 30, 300, "091", 50, 100, "即死系", 10, { 一時的状態: "２倍" }),
        new 敵情報(1, "ﾒﾀﾙｽﾗｲﾑ", 8, 31, 40, 1500, 1500, "004", 250, 10, "ｽﾗｲﾑ", 3, "にげだす", 0, { 一時的状態: "魔無効" })
      ]);
      new クエスト情報("荒野の獣道", "stage6.gif", [
        [...アイテム.名前範囲("おおきづち", "ｸｻﾅｷﾞの剣")],
        [...アイテム.名前範囲("旅人の服", "鉄の鎧")],
        [
          ...アイテム.名前範囲("命の木の実", "ﾓﾝｽﾀｰ金貨"),
          "へんげの杖",
          ...アイテム.名前範囲("身代わり人形", "不思議なﾀﾝﾊﾞﾘﾝ")
        ]
      ], [
        new 敵情報(undefined, "ｷﾞｶﾞﾝﾃｽ", 2500, 60, 200, 20, 20, "563", 200, 5, "ﾊﾞｰｻｰｶｰ", 60, "無職", 20, { 命中率: 150, 状態異常: "眠り", 一時的状態: "眠り" })
      ], [
        new 敵情報(4, "ﾏｰｼﾞﾏﾀﾝｺﾞ", 80, 39, 65, 65, 80, "032", 23, 18, "猛毒系", 999),
        new 敵情報(4, "ｷﾝｸﾞｺﾌﾞﾗ", 100, 0, 85, 35, 60, "054", 21, 8, undefined, undefined, "無職", 20),
        new 敵情報(3, "ﾚｯﾄﾞｱｲ", 80, 61, 50, 30, 40, "074", 24, 10, "ｱｻｼﾝ", 15),
        new 敵情報(4, "ﾀﾞｰｸｱｲ", 70, 71, 60, 30, 50, "075", 28, 11, "ｱｻｼﾝ", 16),
        new 敵情報(4, "ﾓﾋｶﾝﾄ", 160, 22, 120, 50, 35, "210", 27, 14, "羊飼い", 10, "無職", 20, { 状態異常: "眠り" }),
        new 敵情報(3, "ﾍﾞﾋﾞｰﾊﾟﾝｻｰ", 90, 0, 75, 25, 125, "206", 18, 12, undefined, undefined, "無職", 20),
        new 敵情報(2, "ｷﾗｰﾊﾟﾝｻｰ", 130, 19, 105, 30, 74, "207", 30, 10, "ﾊﾞｰｻｰｶｰ", 20, "無職", 20),
        new 敵情報(2, "ﾆｮﾛﾛ", 75, 34, 96, 20, 80, "229", 28, 26, "結界士", 5, { 命中率: 70 }),
        new 敵情報(2, "ﾗﾌﾚｼｱ", 95, 44, 86, 27, 40, "230", 30, 26, "悪魔", 26),
        new 敵情報(2, "ﾓｻﾓｻ", 100, 59, 60, 40, 70, "512", 15, 100, "ﾓｰｸﾞﾘ", 100),
        new 敵情報(2, "ﾃﾞｽﾛｰﾊﾟｰ", 80, 20, 90, 80, 60, "514", 32, 16, "ﾊﾞﾝﾊﾟｲｱ", 20),
        new 敵情報(1, "ｻﾝﾀﾞｰｼｰﾌﾟ", 150, 50, 70, 50, 20, "513", 50, 50, "勇者", 30, "無職", 30)
      ]);
      new クエスト情報("マグマ山", "stage7.gif", [
        [...アイテム.名前範囲("鎖がま", "ｸｻﾅｷﾞの剣")],
        [...アイテム.名前範囲("ｽﾗｲﾑの服", "魔法の法衣")],
        [
          ...アイテム.名前範囲("魔法の鏡", "ﾓﾝｽﾀｰ金貨"),
          ...アイテム.名前範囲("身代わり人形", "不思議なﾀﾝﾊﾞﾘﾝ")
        ]
      ], [
        new 敵情報(undefined, "ﾎﾞﾑA", 100, 42, 80, 80, 80, "071", 55, 30, "悪魔", 10, "無職", 20),
        new 敵情報(undefined, "ひくいどり", 1800, 97, 160, 70, 80, "530", 300, 180, "忍者", 15, "風水士", 10, { 一時的状態: "魔軽減", 命中率: 150 }),
        new 敵情報(undefined, "ﾎﾞﾑB", 100, 42, 80, 80, 80, "071", 55, 30, "悪魔", 10, "無職", 20)
      ], [
        new 敵情報(1, "ﾌｧｲｱｰｽﾗｲﾑ", 100, 100, 77, 58, 82, "008", 25, 12, "魔法使い", 16),
        new 敵情報(1, "ﾏｸﾞﾏｽﾗｲﾑ", 130, 0, 93, 70, 30, "021", 30, 27, undefined, undefined, "無職", 30),
        new 敵情報(1, "爆弾岩", 100, 42, 86, 40, 10, "080", 50, 15, "自爆系", 20),
        new 敵情報(1, "ﾁｸﾘ", 111, 26, 111, 75, 20, "211", 34, 25, "ﾊﾞｰｻｰｶｰ", 10, undefined, 30),
        new 敵情報(1, "ﾎﾞﾑ", 70, 42, 60, 80, 60, "071", 35, 20, "悪魔", 10, undefined, 20),
        new 敵情報(1, "ﾁﾋﾞﾄﾞﾗｺﾞﾝ", 120, 26, 78, 65, 66, "083", 30, 12, "魔物使い", 5),
        new 敵情報(1, "ﾌﾞﾗｯｸﾄﾞﾗｺ", 110, 17, 90, 100, 50, "084", 32, 20, "忍者", 5),
        new 敵情報(1, "ﾄﾞﾗｺﾞﾝ", 200, 21, 140, 75, 68, "224", 60, 24, "忍者", 15),
        new 敵情報(1, "ﾁﾋﾞｴｯｸﾞ", 80, 60, 70, 80, 100, "114", 20, 14, "ﾓｰｸﾞﾘ", 100),
        new 敵情報(1, "ﾐﾆﾀｳﾙｽ", 140, 20, 112, 50, 90, "115", 26, 18, "ﾓｰｸﾞﾘ", 10, "無職", 30),
        new 敵情報(1, "炎の戦士", 110, 27, 152, 30, 60, "576", 28, 10, "忍者", 5, "無職", 20)
      ]);
      new クエスト情報("妖精の森", "stage8.gif", [
        [...アイテム.名前範囲("聖なるﾅｲﾌ", "ﾓｰﾆﾝｸﾞｽﾀｰ")],
        [...アイテム.名前範囲("青銅の鎧", "ｿﾞﾝﾋﾞﾒｲﾙ")],
        [
          ...アイテム.名前範囲("魔法の鏡", "ﾓﾝｽﾀｰ金貨"),
          ...アイテム.名前範囲("魔法の鏡", "ﾓﾝｽﾀｰ金貨"),
          "ﾏﾈﾏﾈの心",
          ...アイテム.名前範囲("身代わり人形", "不思議なﾀﾝﾊﾞﾘﾝ")
        ]
      ], [
        new 敵情報(undefined, "ﾍﾞﾋｰﾓｽ", 2800, 299, 185, 125, 145, "553", 350, 200, "竜騎士", 30, "ﾓﾝｸ", 5, { 命中率: 150, 一時的状態: "大防御" })
      ], [
        new 敵情報(3, "ｺﾛﾋｰﾛｰ", 100, 21, 80, 60, 60, "100", 30, 15, "勇者", 10, "無職", 20, { 命中率: 70 }),
        new 敵情報(3, "ｺﾛﾌｧｲﾀｰ", 120, 11, 90, 70, 10, "101", 30, 15, "戦士", 30, "無職", 20, { 命中率: 70 }),
        new 敵情報(3, "ｺﾛﾏｰｼﾞ", 80, 61, 50, 30, 80, "102", 30, 15, "魔法使い", 14, { 命中率: 70 }),
        new 敵情報(3, "ｺﾛﾌﾟﾘｰｽﾄ", 90, 51, 60, 40, 60, "103", 30, 15, "僧侶", 6, { 命中率: 70 }),
        new 敵情報(1, "爆弾岩", 100, 42, 86, 40, 10, "080", 40, 5, "自爆系", 20),
        new 敵情報(1, "ﾒｶﾞｻﾞﾙﾛｯｸ", 110, 42, 75, 50, 44, "081", 36, 10, "騎士", 80, "無職", 30),
        new 敵情報(2, "ﾏﾈﾏﾈ", 133, 99, 99, 33, 99, "068", 33, 33, "ものまね士", 999),
        new 敵情報(1, "ｲﾀｽﾞﾗ妖精", 140, 50, 100, 40, 120, "110", 27, 20, "遊び人", 999, "妖精", 999),
        new 敵情報(1, "ｷﾞｬﾝﾌﾞﾙ妖精", 104, 20, 120, 40, 130, "111", 28, 22, "ものまね士", 50, "妖精", 999),
        new 敵情報(1, "ﾏｳｻｷﾞ", 104, 20, 120, 40, 130, "260", 28, 22, "遊び人", 999, "ものまね士", 80)
      ]);
      new クエスト情報("スライムランド", "stage9.gif", [
        [...アイテム.名前範囲("聖なるﾅｲﾌ", "ｸｻﾅｷﾞの剣")],
        [...アイテム.名前範囲("青銅の鎧", "忍びの服")],
        [
          ...アイテム.名前範囲("魔法の鏡", "ﾓﾝｽﾀｰ金貨"),
          ...アイテム.名前範囲("魔法の鏡", "ﾓﾝｽﾀｰ金貨"),
          "ｽﾗｲﾑの心",
          ...アイテム.名前範囲("身代わり人形", "不思議なﾀﾝﾊﾞﾘﾝ")
        ]
      ], [
        new 敵情報(undefined, "ｽﾗｲﾑA", 150, 91, 120, 20, 100, "002", 30, 10, "時魔道士", 20),
        new 敵情報(undefined, "ｽﾗｲﾑB", 150, 91, 120, 20, 100, "002", 30, 10, "黒魔道士", 80),
        new 敵情報(undefined, "ｷﾝｸﾞｽﾗｲﾑ", 3000, 400, 200, 150, 120, "516", 500, 400, "ﾊﾞｰｻｰｶｰ", 5, "無職", 20, { 命中率: 150, 一時的状態: "攻無効" }),
        new 敵情報(undefined, "ｽﾗｲﾑC", 150, 91, 120, 20, 100, "002", 30, 10, "白魔道士", 70),
        new 敵情報(undefined, "ｽﾗｲﾑD", 150, 91, 120, 20, 100, "002", 30, 10, "赤魔道士", 90)
      ], [
        new 敵情報(3, "ﾌﾞﾁｽﾗｲﾑ", 77, 0, 77, 77, 77, "001", 22, 22),
        new 敵情報(8, "ｽﾗｲﾑ", 90, 30, 90, 40, 90, "002", 25, 20, "ｽﾗｲﾑﾗｲﾀﾞｰ", 10),
        new 敵情報(4, "ｽﾗｲﾑﾍﾞｽ", 100, 0, 105, 30, 100, "003", 28, 24, undefined, undefined, "無職", 20),
        new 敵情報(4, "ﾊﾞﾌﾞﾙｽﾗｲﾑ", 140, 32, 120, 50, 70, "020", 35, 10, "猛毒系", 20),
        new 敵情報(4, "ﾎｲﾐｽﾗｲﾑ", 100, 45, 90, 30, 100, "010", 30, 15, "僧侶", 6),
        new 敵情報(4, "しびれｸﾗｹﾞ", 120, 31, 126, 42, 65, "012", 36, 11, "麻痺系"),
        new 敵情報(3, "ｽﾗｲﾑまどう", 110, 84, 85, 30, 100, "013", 34, 21, "闇魔道士", 16),
        new 敵情報(3, "ｽﾗｲﾑつむり", 60, 43, 90, 130, 40, "015", 32, 27, "ｽﾗｲﾑ", 7),
        new 敵情報(3, "ﾌｧｲｱｰｽﾗｲﾑ", 125, 15, 125, 85, 75, "008", 40, 25, "魔物使い", 5),
        new 敵情報(3, "ｽﾗｲﾑﾊﾞｯﾄ", 100, 44, 115, 20, 155, "027", 41, 11, "ﾊﾞﾝﾊﾟｲｱ", 20),
        new 敵情報(2, "ﾍﾞﾎﾏｽﾗｲﾑ", 150, 99, 90, 30, 120, "011", 40, 30, "僧侶", 999),
        new 敵情報(2, "ﾏｸﾞﾏｽﾗｲﾑ", 90, 10, 148, 140, 50, "021", 38, 31, "商人", 3),
        new 敵情報(1, "ﾋﾞｯｸｽﾗｲﾑ", 300, 0, 145, 10, 40, "006", 40, 30),
        new 敵情報(1, "ｽﾗｲﾑﾌｧﾗｵ", 444, 144, 144, 144, 144, "234", 144, 144),
        new 敵情報(1, "ﾒﾀﾙｽﾗｲﾑ", 8, 31, 70, 2500, 2600, "004", 250, 10, "ｽﾗｲﾑ", 3, "逃げ出す", 0, { 一時的状態: "魔無効" }),
        new 敵情報(1, "ﾊｸﾞﾚﾒﾀﾙ", 14, 61, 110, 4000, 2000, "022", 1500, 30, "ﾊｸﾞﾚﾒﾀﾙ", 25, "逃げ出す", 0, { 一時的状態: "魔無効" })
      ]);
      new クエスト情報("死霊の沼地", "stage10.gif", [
        [...アイテム.名前範囲("鋼鉄の剣", "ﾋﾞｯｸﾞﾎﾞｳｶﾞﾝ")],
        [...アイテム.名前範囲("さまよう鎧", "銀の胸当て")],
        [
          ...アイテム.名前範囲("命の木の実", "ﾓﾝｽﾀｰ金貨"),
          ...アイテム.名前範囲("命の木の実", "ﾓﾝｽﾀｰ金貨"),
          "精霊の守り", "伯爵の血",
          ...アイテム.名前範囲("身代わり人形", "不思議なﾀﾝﾊﾞﾘﾝ")
        ]
      ], [
        new 敵情報(undefined, "死霊A", 299, 42, 119, 199, 66, "072", 63, 13, "青魔道士", 60),
        new 敵情報(undefined, "死霊の騎士", 5500, 999, 260, 180, 180, "566", 666, 444, "魔剣士", 70, "剣士", 999, { 命中率: 200, 最大ＭＰ: 5000, 一時的状態: "受流し" }),
        new 敵情報(undefined, "死霊B", 299, 42, 119, 199, 66, "072", 63, 13, "青魔道士", 60),
      ], [
        new 敵情報(1, "ﾌﾞﾗｯﾄﾞﾊﾝﾄﾞ", 160, 41, 130, 50, 60, "064", 41, 10, "盗賊", 10, "ﾈｸﾛﾏﾝｻｰ", 10),
        new 敵情報(1, "ﾏﾐｰ", 170, 0, 150, 60, 60, "041", 43, 16, undefined, undefined, "無職", 20),
        new 敵情報(1, "ｽｶﾙﾍｯﾄﾞ", 90, 96, 90, 180, 60, "056", 44, 20, "忍者", 60),
        new 敵情報(1, "影の騎士", 200, 16, 170, 30, 64, "044", 43, 25, "魔剣士", 30),
        new 敵情報(1, "ｼｬﾄﾞｰ", 94, 44, 90, 185, 144, "046", 41, 20, "ﾄﾞﾗｺﾞﾝ", 30),
        new 敵情報(1, "あやしい影", 98, 44, 110, 190, 144, "047", 43, 30, "即死系", 30),
        new 敵情報(1, "ｽﾗｲﾑﾊﾞｯﾄ", 140, 54, 145, 60, 185, "027", 40, 15, "ﾊﾞﾝﾊﾟｲｱ", 20),
        new 敵情報(1, "死霊", 199, 42, 119, 199, 66, "072", 45, 13, "青魔道士", 60),
        new 敵情報(1, "ﾊﾞﾌﾞﾙﾎﾟｲｽﾞﾝ", 180, 92, 160, 80, 60, "237", 39, 21, "猛毒系", 20),
        new 敵情報(1, "ﾃﾞﾋﾞﾙｷｬｯﾄ", 160, 32, 140, 80, 160, "231", 41, 22, "ﾊｸﾞﾚﾒﾀﾙ", 25),
        new 敵情報(1, "ｷﾘﾏ", 200, 62, 100, 10, 200, "528", 50, 10, "光魔道士", 110)
      ]);
      new クエスト情報("ドラゴンの谷", "stage11.gif", [
        [...アイテム.名前範囲("ｿﾞﾝﾋﾞｷﾗｰ", "ﾄﾞﾗｺﾞﾝｷﾗｰ")],
        [...アイテム.名前範囲("ｿﾞﾝﾋﾞﾒｲﾙ", "水の羽衣")],
        [
          ...アイテム.名前範囲("命の木の実", "ﾓﾝｽﾀｰ金貨"),
          "賢者の悟り", "ﾄﾞﾗｺﾞﾝの心",
          ...アイテム.名前範囲("身代わり人形", "不思議なﾀﾝﾊﾞﾘﾝ")
        ]
      ], [
        new 敵情報(undefined, "竜王", 8000, 3000, 300, 240, 100, "560", 999, 500, "ﾄﾞﾗｺﾞﾝ", 999, "ﾓﾝｸ", 1999, { 命中率: 200, 最大ＭＰ: 8000, 一時的状態: "息反撃" }),
        new 敵情報(undefined, "ﾌﾞﾙｰｽﾄｰﾝ", 15, 999, 200, 5000, 1000, "191", 70, 500, "賢者", 130, "青魔道士", 999, { 一時的状態: "魔無効" })
      ], [
        new 敵情報(2, "ﾌﾟﾁﾋｰﾛｰ", 220, 61, 140, 120, 110, "105", 50, 20, "勇者", 60, "無職", 20),
        new 敵情報(2, "ﾌﾟﾁﾌｧｲﾀｰ", 250, 41, 170, 150, 20, "106", 50, 20, "戦士", 999, "無職", 20),
        new 敵情報(2, "ﾌﾟﾁﾏｰｼﾞ", 160, 191, 100, 60, 150, "107", 50, 20, "魔法使い", 60),
        new 敵情報(2, "ﾌﾟﾁﾌﾟﾘｰｽﾄ", 170, 181, 120, 80, 90, "108", 50, 20, "僧侶", 55),
        new 敵情報(1, "ﾌﾞﾙｰﾄﾞﾗｺﾞﾝ", 150, 98, 155, 80, 120, "226", 51, 15, "ﾄﾞﾗｺﾞﾝ", 90),
        new 敵情報(1, "ﾊｸﾘｭｳ", 200, 69, 160, 90, 180, "232", 60, 20, "忍者", 60),
        new 敵情報(1, "ｻﾗﾏﾝﾀﾞｰ", 280, 79, 170, 150, 110, "533", 63, 24, "忍者", 60),
        new 敵情報(1, "ﾄﾞﾗｺﾞﾝﾏｯﾄ", 300, 99, 200, 170, 50, "556", 66, 20, "ﾄﾞﾗｺﾞﾝ", 100),
        new 敵情報(1, "ﾃﾞﾝﾃﾞﾝﾘｭｳ", 340, 99, 210, 180, 120, "550", 68, 22, "ﾄﾞﾗｺﾞﾝ", 30, "忍者", 15)
      ]);
      new クエスト情報("暗黒魔城", "stage12.gif", [
        [
          ...アイテム.名前範囲("妖精の剣", "諸刃の剣"),
          ...アイテム.名前範囲("ｶﾞｲｱの剣", "魔人の斧")
        ],
        [
          ...アイテム.名前範囲("天使のﾛｰﾌﾞ", "地獄の鎧"),
          ...アイテム.名前範囲("ﾄﾞﾗｺﾞﾝﾛｰﾌﾞ", "魔人の鎧")
        ],
        [
          ...アイテム.名前範囲("賢者の石", "世界樹の葉"),
          ...アイテム.名前範囲("祈りの指輪"),
          ...アイテム.名前範囲("ｽｷﾙの種", "小さなﾒﾀﾞﾙ"),
          new 連続("勇者の証", 2),
          new 連続("邪神像", 2),
          "ｼﾞｪﾉﾊﾞ細胞",
          ...アイテム.名前範囲("身代わり人形", "不思議なﾀﾝﾊﾞﾘﾝ")
        ]
      ], [
        new 敵情報(undefined, "ﾊﾟｰﾌﾟﾙｽﾄｰﾝ", 20, 999, 250, 6000, 2000, "194", 100, 500, "猛毒系", 999, "眠り系", 999, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "魔王", 14000, 4000, 320, 300, 140, "700", 2000, 1500, "魔王", 999, "暗黒騎士", 999, { 命中率: 250, 最大ＭＰ: 10000, 一時的状態: "攻反撃" }),
        new 敵情報(undefined, "ﾚｯﾄﾞｽﾄｰﾝ", 20, 999, 250, 6000, 2000, "190", 100, 500, "忍者", 999, "魔法使い", 999, { 一時的状態: "魔無効" })
      ], [
        new 敵情報(4, "ﾋﾞｯｸﾞｱｲ", 180, 64, 180, 100, 180, "526", 70, 35, "悪魔", 26, "無職", 30),
        new 敵情報(5, "ﾁﾋﾞﾍﾞﾛｽ", 150, 0, 160, 80, 200, "203", 45, 15, "無職", 20),
        new 敵情報(4, "ｹﾙﾍﾞﾛｽ", 270, 33, 220, 130, 50, "204", 60, 60, "時魔道士", 20, "無職", 20),
        new 敵情報(4, "闇の剣士", 230, 64, 215, 120, 125, "220", 74, 50, "剣士", 80, "無職", 20),
        new 敵情報(4, "黒の騎士", 255, 54, 185, 155, 35, "222", 75, 40, "戦士", 70, "無職", 30),
        new 敵情報(4, "ｽｶﾙｷﾝｸﾞ", 210, 48, 180, 110, 110, "567", 70, 40, "ﾊﾞﾝﾊﾟｲｱ", 50),
        new 敵情報(2, "ﾊﾞﾝﾊﾟｲｱ", 280, 44, 200, 120, 150, "568", 76, 50, "ﾊﾞﾝﾊﾟｲｱ", 999, "無職", 20),
        new 敵情報(2, "ﾐﾗｰﾅｲﾄ", 200, 94, 200, 180, 180, "520", 70, 70, "ものまね士", 999),
        new 敵情報(2, "ﾃﾞﾋﾞﾙｱｲ", 180, 64, 220, 120, 200, "539", 62, 20, "ｱｻｼﾝ", 30,),
        new 敵情報(1, "ﾊﾟﾝﾄﾞﾗﾎﾞｯｸｽ", 900, 69, 300, 95, 800, "092", 100, 500, "即死系", 20, { 一時的状態: "２倍" }),
        new 敵情報(1, "ﾊｸﾞﾚﾒﾀﾙ", 14, 91, 110, 4000, 2000, "022", 1500, 30, "ﾊｸﾞﾚﾒﾀﾙ", 25, "逃げ出す", 0)
      ]);
      new クエスト情報("死の大地", "stage13.gif", [
        [
          ...アイテム.名前範囲("妖精の剣", "諸刃の剣"),
          ...アイテム.名前範囲("ｶﾞｲｱの剣", "魔人の斧")
        ],
        [
          ...アイテム.名前範囲("天使のﾛｰﾌﾞ", "地獄の鎧"),
          ...アイテム.名前範囲("ﾄﾞﾗｺﾞﾝﾛｰﾌﾞ", "魔人の鎧")
        ],
        [
          ...アイテム.名前範囲("賢者の石", "世界樹の葉"),
          "祈りの指輪", "ｽｷﾙの種", "幸せの種",
          ...new 連続("小さなﾒﾀﾞﾙ", 2),
          "勇者の証", "邪神像", "闇のﾛｻﾞﾘｵ", "ｷﾞｬﾝﾌﾞﾙﾊｰﾄ", "ｼﾞｪﾉﾊﾞ細胞", "時の砂", "ｲﾝﾃﾘﾒｶﾞﾈ"
        ]
      ], [
        new 敵情報(undefined, "ﾌﾞﾗｯｸｽﾄｰﾝ", 20, 999, 250, 6000, 2000, "195", 100, 800, "闇魔道士", 999, "悪魔", 999, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "死神", 12000, 5000, 360, 180, 240, "702", 2000, 1500, "闇魔道士", 70, "ｷﾞｬﾝﾌﾞﾗｰ", 999, { 命中率: 250, 一時的状態: "魔反撃", 最大ＭＰ: 14000 }),
        new 敵情報(undefined, "ﾌﾞﾙｰｽﾄｰﾝ", 20, 999, 250, 6000, 2000, "191", 100, 800, "賢者", 130, "青魔道士", 999, { 一時的状態: "魔無効" })
      ], [
        new 敵情報(1, "竜魔人", 450, 85, 270, 200, 50, "523", 85, 70, "竜騎士", 50, "無職", 20),
        new 敵情報(1, "ﾃﾞｽｻｲｽﾞ", 250, 139, 230, 80, 200, "543", 86, 142, "即死系", 10),
        new 敵情報(1, "魔王の影", 200, 120, 220, 300, 150, "527", 80, 75, "魔王", 50),
        new 敵情報(1, "ｷﾗｰﾏｼﾝ", 444, 111, 244, 144, 114, "521", 88, 88, "魔剣士", 50, "弓使い", 90),
        new 敵情報(1, "ﾍﾞﾋｰﾓｽ", 415, 97, 265, 85, 145, "553", 90, 40, "竜騎士", 30, "ﾓﾝｸ", 5),
        new 敵情報(1, "ｷﾞｶﾞﾝﾃｽ", 600, 59, 400, 50, 10, "563", 100, 5, "ﾊﾞｰｻｰｶｰ", 999, "無職", 20, { 命中率: 70, 一時的状態: "２倍", 状態異常: "眠り", テンション: 20 }),
        new 敵情報(1, "ﾉﾛｲ", 380, 59, 200, 160, 180, "542", 82, 65, "ｷﾞｬﾝﾌﾞﾗｰ", 80, "無職", 20),
        new 敵情報(1, "ﾔﾐ", 410, 69, 280, 150, 120, "536", 88, 64, "ｿﾙｼﾞｬｰ", 140, "無職", 20),
        new 敵情報(1, "ﾊﾞｼﾞﾘｽｸ", 400, 67, 300, 40, 280, "558", 90, 80, "蟲師", 999, "無職", 20)
      ]);
      new クエスト情報("魔界", "stage14.gif", [
        [
          ...アイテム.名前範囲("ﾄﾞﾗｺﾞﾝﾃｲﾙ", "諸刃の剣"),
          ...アイテム.名前範囲("正義のｿﾛﾊﾞﾝ", "魔人の斧"),
          "破壊の鉄球"
        ], [
          ...アイテム.名前範囲("光の鎧", "王者のﾏﾝﾄ")
        ], [
          ...アイテム.名前範囲("賢者の石", "世界樹の葉"),
          "ｴﾙﾌの飲み薬", "勇者の証", "邪神像", "ｷﾞｻﾞｰﾙの野菜", "ｸﾎﾟの実",
          new 連続("ｼﾞｪﾉﾊﾞ細胞", 2),
          ...アイテム.名前範囲("天馬のたづな", "ﾊﾟｰﾌﾟﾙｵｰﾌﾞ"),
          "時の砂",
          ...アイテム.名前範囲("復活の草", "宝物庫の鍵")
        ]
      ], [
        new 敵情報(undefined, "ｲﾋﾞﾙｻﾝﾀﾞｰA", 5000, 999, 400, 300, 3000, "696", 300, 300, "結界士", 999, "ｴﾙﾌ", 999, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "ｻﾀﾝ", 15000, 8000, 600, 300, 250, "800", 3000, 3000, "ｿﾙｼﾞｬｰ", 999, "堕天使", 999, { 命中率: 400, 最大ＭＰ: 30000 }),
        new 敵情報(undefined, "ｲﾋﾞﾙｻﾝﾀﾞｰB", 5000, 999, 400, 300, 3000, "696", 300, 300, "魔王", 999, "召喚士", 999, { 一時的状態: "魔無効" })
      ], [
        new 敵情報(6, "ﾃﾞｽﾏｼﾝ", 555, 222, 333, 222, 222, "522", 111, 111, "魔剣士", 999, "弓使い", 999),
        new 敵情報(5, "ｷﾝｸﾞﾍﾞﾋｰﾓｽ", 600, 149, 350, 180, 160, "554", 120, 100, "ﾊﾞｰｻｰｶｰ", 40, "無職", 20),
        new 敵情報(5, "ｲｸﾛﾌﾟｽ", 700, 99, 500, 50, 50, "564", 150, 10, "戦士", 999, "ﾊﾞｰｻｰｶｰ", 20),
        new 敵情報(5, "ﾀﾞｰｽﾄﾞﾗｺﾞﾝ", 500, 149, 300, 240, 200, "534", 125, 95, "ﾄﾞﾗｺﾞﾝ", 999, "無職", 20),
        new 敵情報(5, "ｽﾄｰﾝｺﾞｰﾚﾑ", 300, 155, 280, 400, 100, "547", 100, 200, "騎士", 60, "無職", 30),
        new 敵情報(4, "ﾗﾎﾞｽ", 420, 299, 270, 320, 120, "540", 90, 400, "時魔道士", 999, "即死系", 20),
        new 敵情報(4, "ｻｲｸﾙ", 350, 149, 280, 100, 30, "235", 115, 125, "堕天使", 160, "ｷﾞｬﾝﾌﾞﾗｰ", 999),
        new 敵情報(2, "ﾄﾞﾗｺﾞﾝｿﾞﾝﾋﾞ", 650, 92, 350, 260, 100, "557", 155, 100, "ﾀﾞｰｸｴﾙﾌ", 999, "魔人", 999, { 一時的状態: "復活" }),
        new 敵情報(1, "ﾀﾞｲｼﾞｬ", 760, 292, 460, 160, 260, "559", 255, 300, "蟲師", 999, "堕天使", 40, { 一時的状態: "復活" }),
        new 敵情報(1, "ﾒﾀﾙｷﾝｸﾞ", 25, 249, 200, 6000, 2000, "517", 4000, 100, "ﾊｸﾞﾚﾒﾀﾙ", 999, "逃げ出す", 0, { 一時的状態: "魔無効" })
      ]);
      new クエスト情報("鏡の世界", "stage15.gif", [
        [...アイテム.名前範囲("ｿﾞﾝﾋﾞｷﾗｰ", "破壊の鉄球")],
        [...アイテム.名前範囲("ｽﾗｲﾑｱｰﾏｰ", "王者のﾏﾝﾄ")],
        [
          "ｴﾙﾌの飲み薬",
          ...アイテム.名前範囲("賢者の悟り", "ｼﾞｪﾉﾊﾞ細胞"),
          "妖精の笛", "悪魔のしっぽ",
          ...アイテム.名前範囲("魔銃", "ﾋｰﾛｰｿｰﾄﾞ2"),
          "ﾁｮｺﾎﾞの羽", "ｲﾝﾃﾘﾒｶﾞﾈ"
        ]
      ]); // TODO 依存
      new クエスト情報("マダムガーデン", "stage16.gif", [
        [...アイテム.名前範囲("ｿﾞﾝﾋﾞｷﾗｰ", "ﾃﾞｰﾓﾝｽﾋﾟｱ")],
        [...アイテム.名前範囲("ｽﾗｲﾑｱｰﾏｰ", "ﾌﾞﾗｯﾄﾞﾒｲﾙ")],
        [
          ...アイテム.名前範囲("命の木の実", "ﾓﾝｽﾀｰ金貨"),
          ...アイテム.名前範囲("命の木の実", "ﾓﾝｽﾀｰ金貨"),
          "賢者の悟り", "ﾄﾞﾗｺﾞﾝの心", "ﾌｧｲﾄ一発", "ｴｯﾁな本",
          ...アイテム.名前範囲("妖精の笛", "時の砂"),
          "ｲﾝﾃﾘﾒｶﾞﾈ"
        ]
      ], [
        new 敵情報(undefined, "ﾒﾀﾙｷﾝｸﾞA", 25, 299, 200, 8000, 2000, "517", 4000, 100, "ﾊｸﾞﾚﾒﾀﾙ", 999, "逃げ出す", 0, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "ｺﾞｰﾙﾃﾞﾝｽﾗｲﾑ", 10, 399, 300, 15000, 8000, "590", 5000, 10000, "ﾊｸﾞﾚﾒﾀﾙ", 999, "逃げ出す", 0, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "ﾒﾀﾙｷﾝｸﾞB", 25, 299, 200, 8000, 2000, "517", 4000, 100, "ﾊｸﾞﾚﾒﾀﾙ", 999, "逃げ出す", 0, { 一時的状態: "魔無効" })
      ], [
        new 敵情報(4, "ﾒﾀﾙｽﾗｲﾑ", 8, 31, 70, 2500, 1500, "004", 250, 10, "ｽﾗｲﾑ", 3, "逃げ出す", 0, { 一時的状態: "魔無効" }),
        new 敵情報(2, "ﾊｸﾞﾚﾒﾀﾙ", 14, 61, 110, 4000, 2000, "022", 1500, 30, "ﾊｸﾞﾚﾒﾀﾙ", 25, "逃げ出す", 0, { 一時的状態: "魔無効" }),
        new 敵情報(1, "ﾒﾀﾙｷﾝｸﾞ", 25, 199, 200, 8000, 2000, "517", 4000, 100, "ﾊｸﾞﾚﾒﾀﾙ", 999, "逃げ出す", 0, { 一時的状態: "魔無効" })
      ]);
      new クエスト情報("幻の秘境", "stage17.gif", [
        [...アイテム.名前範囲("ひのきの棒", "破壊の鉄球")],
        [...アイテム.名前範囲("布の服", "王者のﾏﾝﾄ")],
        [
          ...アイテム.名前範囲("薬草", "ｲﾝﾃﾘﾒｶﾞﾈ"),
          "福袋", "幸福袋",
          ...アイテム.名前範囲("馬のﾌﾝ", "金塊")
        ]
      ], [
        new 敵情報(undefined, "人食い箱", 1000, 500, 350, 50, 400, "090", 200, 400, "眠り系", 999, "無職", 20, { 一時的状態: "２倍" }),
        new 敵情報(undefined, "ﾐﾐｯｸ", 1500, 500, 360, 100, 700, "091", 400, 800, "即死系", 999, "無職", 20, { 命中率: 150, 一時的状態: "２倍" }),
        new 敵情報(undefined, "ﾊﾟﾝﾄﾞﾗﾎﾞｯｸｽ", 2000, 999, 370, 150, 800, "092.gif", 600, 1000, "即死系", 93, "無職", 20, { 命中率: 150, 一時的状態: "２倍" }),
        new 敵情報(undefined, "ﾄﾗｯﾌﾟﾎﾞｯｸｽ", 2500, 999, 380, 200, 900, "575", 800, 2000, "闇魔道士", 999, "即死系", 999, { 命中率: 200, 一時的状態: "２倍" })
      ], [
        new 敵情報(1, "ｺﾛﾋｰﾛｰ", 270, 200, 300, 150, 150, "100", 99, 50, "勇者", 999, "無職", 20, { 命中率: 70 }),
        new 敵情報(1, "ｺﾛﾌｧｲﾀｰ", 280, 100, 320, 250, 50, "101", 99, 50, "戦士", 999, "無職", 20, { 命中率: 70 }),
        new 敵情報(1, "ｺﾛﾏｰｼﾞ", 240, 400, 150, 100, 300, "102", 99, 50, "魔法使い", 999, "無職", 20, { 命中率: 70 }),
        new 敵情報(1, "ｺﾛﾌﾟﾘｰｽﾄ", 250, 300, 200, 150, 200, "103", 99, 50, "僧侶", 999, "無職", 20, { 命中率: 70 }),
        new 敵情報(1, "ﾌﾟﾁﾋｰﾛｰ", 320, 250, 280, 150, 150, "105", 99, 50, "勇者", 999, "無職", 20),
        new 敵情報(1, "ﾌﾟﾁﾌｧｲﾀｰ", 340, 150, 320, 250, 50, "106", 99, 50, "戦士", 999, "無職", 20),
        new 敵情報(1, "ﾌﾟﾁﾏｰｼﾞ", 250, 300, 150, 100, 300, "107", 99, 50, "魔法使い", 999, "無職", 20),
        new 敵情報(1, "ﾌﾟﾁﾌﾟﾘｰｽﾄ", 270, 250, 200, 150, 200, "108", 99, 50, "無職", 20)
      ]);
      new クエスト情報("闇のランプ", "stage18.gif", [
        [...アイテム.名前範囲("ｶﾞｲｱの剣", "魔人の斧")],
        [...アイテム.名前範囲("ﾄﾞﾗｺﾞﾝﾛｰﾌﾞ", "魔人の鎧")],
        ["闇のｵｰﾌﾞ", "次元のｶｹﾗ", "次元のｶｹﾗ"]
      ], [
        new 敵情報(undefined, "悪の右目", 3000, 999, 380, 200, 200, "580", 500, 100, "ﾀﾞｰｸｴﾙﾌ", 999, "悪魔", 999, { 命中率: 250, 一時的状態: "魔無効" }),
        new 敵情報(undefined, "悪の口", 5000, 3000, 450, 30, 300, "582", 700, 300, "ﾄﾞﾗｺﾞﾝ", 999, "ﾊﾞﾝﾊﾟｲｱ", 999, { 命中率: 250, 一時的状態: "攻反撃" }),
        new 敵情報(undefined, "悪の左目", 3000, 999, 380, 250, 200, "581", 500, 100, "ｴﾙﾌ", 999, "ｱｲﾃﾑ士", 90, { 命中率: 250, 一時的状態: "魔無効" })
      ], [
        new 敵情報(1, "黒ｽﾗｲﾑ", 250, 302, 300, 180, 250, "160", 95, 85, "ｽﾗｲﾑ", 999, "無職", 20, { 一時的状態: "魔吸収" }),
        new 敵情報(1, "黒ﾄﾞﾗｷｰ", 330, 333, 380, 50, 300, "161", 85, 65, "ﾊﾞﾝﾊﾟｲｱ", 90, "無職", 20, { 状態異常: "混乱" }),
        new 敵情報(1, "黒ﾏﾈﾏﾈ", 300, 362, 250, 250, 250, "162", 66, 66, "ものまね士", 999, "無職", 20, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "黒ﾅｲﾄ", 380, 101, 390, 280, 100, "163", 96, 46, "戦士", 999, "無職", 20, { 一時的状態: "攻反撃" }),
        new 敵情報(1, "黒ﾎﾞﾑ", 350, 155, 280, 250, 90, "164", 96, 46, "青魔道士", 20, "自爆系", 20, { 状態異常: "眠り" }),
        new 敵情報(1, "黒ﾄﾞｸﾛ", 240, 400, 270, 400, 160, "165", 88, 88, "ﾀﾞｰｸｴﾙﾌ", 999, "無職", 20, { 一時的状態: "魔軽減" })
      ]);
      new クエスト情報("封印の地", "stage19.gif", [
        [...アイテム.名前範囲("ﾃﾞｰﾓﾝｽﾋﾟｱ", "破壊の鉄球")],
        [...アイテム.名前範囲("ﾌﾞﾗｯﾄﾞﾒｲﾙ", "王者のﾏﾝﾄ")],
        [
          ...アイテム.名前範囲("賢者の石", "世界樹の葉"),
          "祈りの指輪",
          ...アイテム.名前範囲("ｽｷﾙの種", "小さなﾒﾀﾞﾙ"),
          "勇者の証", "邪神像", "闇のﾛｻﾞﾘｵ", "ｷﾞｬﾝﾌﾞﾙﾊｰﾄ", "ｼﾞｪﾉﾊﾞ細胞",
          ...アイテム.名前範囲("ｼﾙﾊﾞｰｵｰﾌﾞ", "天空の盾と兜"),
          ...アイテム.名前範囲("魔銃", "ｲﾝﾃﾘﾒｶﾞﾈ")
        ]
      ], [
        new 敵情報(undefined, "封印のﾂﾎﾞ", 15000, 5000, 450, 400, 200, "585", 1000, 100, "召喚系", 999, "召喚系", 999, { 命中率: 500, 一時的状態: "魔無効", 最大ＭＰ: 15000 })
      ], [
        new 敵情報(1, "封印石", 400, 200, 400, 400, 150, "180", 100, 100, "即死系", 999, { 一時的状態: "攻無効" }),
        new 敵情報(1, "封印石", 400, 200, 400, 400, 150, "181", 100, 100, "眠り系", 999, { 一時的状態: "魔無効" }),
        new 敵情報(1, "封印石", 400, 200, 400, 400, 150, "182", 100, 100, "麻痺系", 999, { 一時的状態: "魔無効" })
      ]);
      new クエスト情報("天空城", "stage20.gif", [
        [...アイテム.名前範囲("隼の剣", "ﾊｸﾞﾚﾒﾀﾙの剣")],
        [...アイテム.名前範囲("神秘の鎧", "ﾊｸﾞﾚﾒﾀﾙの鎧")],
        [...new 連続("天馬のたづな", 4)]
      ], [
        new 敵情報(undefined, "ｼﾙﾊﾞｰｽﾄｰﾝ", 20, 999, 500, 8000, 3000, "196", 100, 1000, "光魔道士", 999, "魔銃士", 999, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "片翼の天使", 12000, 8000, 500, 300, 300, "569", 3000, 2000, "超魔法型", 999, "堕天使", 999, { 命中率: 500, 最大ＭＰ: 30000, 一時的状態: "魔反撃" }),
        new 敵情報(undefined, "ﾌﾞﾗｯｸｽﾄｰﾝ", 20, 999, 500, 8000, 3000, "195", 100, 1000, "ﾀﾞｰｸｴﾙﾌ", 999, "蟲師", 999, { 一時的状態: "魔無効" })
      ], [
        new 敵情報(1, "天猫青", 400, 199, 400, 200, 400, "640", 100, 100, "羊飼い", 999, "召喚士", 999),
        new 敵情報(1, "天猫赤", 400, 199, 400, 200, 400, "641", 100, 100, "堕天使", 999, "赤魔道士", 999),
        new 敵情報(1, "天猫黄", 400, 199, 400, 200, 400, "642", 100, 100, "ﾁｮｺﾎﾞ", 999, "ﾊｸﾞﾚﾒﾀﾙ", 999),
        new 敵情報(1, "天卵", 500, 164, 350, 400, 150, "630", 150, 120, "天使", 999, "ﾓｰｸﾞﾘ", 999)
      ]);
      new クエスト情報("カオスフィールド", "stage21.gif", [
        [...アイテム.名前範囲("天空の剣", "ﾊｸﾞﾚﾒﾀﾙの剣")],
        [...アイテム.名前範囲("神秘の鎧", "ﾊｸﾞﾚﾒﾀﾙの鎧")],
        [...new 連続("天馬のたづな", 5)]
      ], [
        new 敵情報(undefined, "魔王", 14000, 4000, 650, 350, 200, "700", 2000, 1500, "魔王", 999, "暗黒騎士", 888, { 命中率: 250, 一時的状態: "攻反撃", 最大ＭＰ: 10000 }),
        new 敵情報(undefined, "ｶﾀｽﾄﾛﾌｨｰ", 15000, 8000, 750, 400, 400, "801", 5000, 3000, "超攻撃型", 999, "ｿﾙｼﾞｬｰ", 999, { 命中率: 500, テンション: 100, 最大ＭＰ: 30000 }),
        new 敵情報(undefined, "死神", 14000, 5000, 600, 250, 999, "702", 2000, 1500, "闇魔道士", 999, "ｷﾞｬﾝﾌﾞﾗｰ", 999, { 命中率: 250, 一時的状態: "魔反撃", 最大ＭＰ: 14000 })
      ], [
        new 敵情報(1, "ﾋﾞｯｸｽﾗｲﾑ", 500, 0, 500, 100, 500, "006", 120, 50, undefined, undefined, "無職", 20, { 一時的状態: "回復" }),
        new 敵情報(1, "人面樹", 700, 263, 550, 200, 250, "503", 170, 140, "商人", 999, "無職", 20, { 一時的状態: "復活" }),
        new 敵情報(1, "亡霊剣士", 860, 343, 650, 200, 150, "500", 180, 80, "剣士", 999, "無職", 20, { 一時的状態: "攻反撃" }),
        new 敵情報(1, "ｷﾗｰｼｪﾙ", 600, 452, 700, 600, 300, "215", 150, 300, "戦士", 999, "無職", 20, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "ﾃﾞﾋﾞﾙｼｪﾙ", 1000, 600, 500, 700, 200, "506", 160, 500, "僧侶", 999, "無職", 30, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "ｺﾞｰﾚﾑ", 1200, 777, 500, 700, 150, "546", 250, 150, "風水士", 999, "無職", 30, { 一時的状態: "攻軽減" }),
        new 敵情報(1, "闇の魔術士", 800, 300, 450, 200, 200, "510", 180, 260, "ﾊｸﾞﾚﾒﾀﾙ", 999, { 一時的状態: "魔吸収" }),
        new 敵情報(1, "ｷﾞｶﾞﾝﾃｽ", 909, 909, 909, 100, 100, "563", 200, 5, "ﾊﾞｰｻｰｶｰ", 999, { テンション: 100 }),
        new 敵情報(1, "ひくいどり", 1100, 997, 530, 270, 380, "530", 180, 180, "忍者", 999, "風水士", 999, { 一時的状態: "息軽減" }),
        new 敵情報(1, "ﾍﾞﾋｰﾓｽ", 909, 909, 777, 255, 555, "553", 211, 99, "竜騎士", 999, "ﾓﾝｸ", 999, { 一時的状態: "大防御" }),
        new 敵情報(1, "ｷﾝｸﾞｽﾗｲﾑ", 1200, 999, 500, 300, 500, "516", 200, 250, "ﾊﾞｰｻｰｶｰ", 999, "無職", 20, { 一時的状態: "攻無効" }),
        new 敵情報(1, "死霊の騎士", 1200, 999, 666, 280, 280, "566", 240, 170, "魔剣士", 999, "剣士", 999, { 一時的状態: "受流し" }),
        new 敵情報(1, "竜王", 1500, 999, 750, 440, 200, "560", 250, 200, "ﾄﾞﾗｺﾞﾝ", 999, "ﾓﾝｸ", 999, { 一時的状態: "息反撃" })
      ]);
      封印戦情報.初期化();
      ダンジョン情報.初期化();
    }
  }

  class 封印戦情報 extends クエスト情報 {
    constructor(名前, 最大参加人数, リーダー名, 行動秒数, 参加条件, ...引数) {
      super(名前, ...引数);
    }

    static 初期化() {
      new 封印戦情報("全てを無に還す者", 6, "破壊神", 12, new クエスト参加条件(ステータス.ＨＰ, 400, true), [
        空配列,
        空配列,
        [
          ...new 連続("天馬のたづな", 4),
          "天空の盾と兜", "次元のｶｹﾗ"
        ]
      ], [
        new 敵情報(undefined, "ﾚｯﾄﾞｽﾄｰﾝ", 50, 999, 400, 9000, 3000, "190", 1000, 2000, "忍者", 999, "魔法使い", 999, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "ﾌﾞﾙｰｽﾄｰﾝ", 50, 999, 500, 9000, 3000, "191", 1000, 2000, "賢者", 130, "青魔道士", 999, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "ｲｴﾛｰｽﾄｰﾝ", 50, 999, 500, 9000, 3000, "1", 1000, 2000, "ものまね士", 999, "結界士", 999, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "破壊神", 150_000, 999_999, 600, 300, 300, "850", 10000, 5000, "超攻撃型", 999, { 命中率: 2000, 一時的状態: "攻軽減", 最大ＭＰ: 9_999_999 }),
        new 敵情報(undefined, "ｸﾞﾘｰﾝｽﾄｰﾝ", 50, 99999, 500, 9000, 3000, "193", 1000, 2000, "猛毒系", 999, "麻痺系", 999, { 一時的状態: "魔無効", 最大ＭＰ: 999999 }),
        new 敵情報(undefined, "ﾊﾟｰﾌﾟﾙｽﾄｰﾝ", 50, 999, 500, 9000, 3000, "194", 1000, 2000, "魔王", 999, "眠り系", 999, { 一時的状態: "魔無効" }),
        new 敵情報(undefined, "ｼﾙﾊﾞｰｽﾄｰﾝ", 50, 99999, 500, 9000, 3000, "196", 500, 2000, "闇魔道士", 999, "悪魔", 999, { 一時的状態: "魔無効", 最大ＭＰ: 999999 }),
      ], 空配列);
      new 封印戦情報("全てを憎む者", 6, "暗黒竜", 12, new クエスト参加条件(ステータス.ＨＰ, 400, true), [
        空配列,
        空配列,
        [
          ...new 連続("天馬のたづな", 4),
          "天空の盾と兜", "次元のｶｹﾗ"
        ]
      ], [
        new 敵情報(undefined, "暗黒竜", 140_000, 99_999, 300, 200, 0, "710", 8000, 5000, "無職", 999, "暗黒竜のﾀﾏｺﾞ", 999, { 命中率: 900, 一時的状態: "受流し", 最大ＭＰ: 999_999 })
      ], [
        new 敵情報(1, "竜王", 600, 299, 550, 400, 100, "560", 250, 100, "ﾄﾞﾗｺﾞﾝ", 999, "ﾓﾝｸ", 999, { 一時的状態: "息反撃" }),
        new 敵情報(1, "火竜", 600, 299, 550, 400, 100, "561", 250, 100, "魔王", 999, "麻痺系", 999, { 一時的状態: "息反撃" }),
        new 敵情報(1, "水竜", 600, 299, 550, 400, 100, "562", 250, 100, "ﾄﾞﾗｺﾞﾝ", 999, "風水士", 999, { 一時的状態: "息反撃" }),
        new 敵情報(1, "ﾍﾞﾋｰﾓｽ", 480, 209, 500, 240, 400, "553", 240, 90, "竜騎士", 999, "ﾓﾝｸ", 999, { 一時的状態: "大防御" }),
        new 敵情報(1, "ｷﾝｸﾞﾍﾞﾋｰﾓｽ", 540, 209, 500, 240, 400, "554", 240, 90, "ﾊﾞｰｻｰｶｰ", 999, "ﾓﾝｸ", 999, { 一時的状態: "攻反撃" }),
        new 敵情報(1, "ｲﾌﾘｰﾄ", 540, 209, 500, 240, 400, "555", 240, 90, "天竜人", 150, "魔人", 999, { 一時的状態: "攻無効" }),
        new 敵情報(1, "ﾄﾞﾗｺﾞﾝﾏｯﾄ", 480, 99, 600, 360, 150, "556", 200, 100, "ﾄﾞﾗｺﾞﾝ", 999, "無職", 20, { 一時的状態: "受流し" }),
        new 敵情報(1, "ﾄﾞﾗｺﾞﾝｿﾞﾝﾋﾞ", 560, 192, 520, 300, 120, "557", 255, 100, "ﾀﾞｰｸｴﾙﾌ", 999, "魔人", 999, { 一時的状態: "復活" })
      ]);
      new 封印戦情報("全てを破壊する者", 6, "悪魔の書", 12, new クエスト参加条件(ステータス.ＨＰ, 300, true), [
        空配列,
        空配列,
        [
          ...new 連続("天馬のたづな", 2),
          ...new 連続("天空の盾と兜", 2)
        ]
      ], [
        new 敵情報(undefined, "悪魔の書", 160_000, 99_999, 100, 100, 700, "615", 5000, 5000, "超魔法型", 999, "召喚", 999, { 最大ＭＰ: 999_999, 一時的状態: "魔無効" })
      ], [
        new 敵情報(1, "一賢者", 250, 399, 100, 60, 300, "508", 70, 150, "光魔道士", 999, "白魔道士", 999, { 一時的状態: "魔無効" }),
        new 敵情報(1, "二賢者", 250, 299, 100, 60, 300, "507", 70, 150, "黒魔道士", 999, "ﾊｸﾞﾚﾒﾀﾙ", 999, { 一時的状態: "魔吸収" }),
        new 敵情報(1, "三賢者", 250, 399, 100, 60, 300, "509", 70, 150, "魔法使い", 999, "闇魔道士", 999, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "四賢者", 250, 399, 100, 60, 300, "511", 70, 150, "賢者", 999, "赤魔道士", 999, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "青魔", 400, 299, 200, 100, 400, "250", 70, 150, "青魔道士", 999, "召喚系", 999, { 一時的状態: "魔吸収" }),
        new 敵情報(1, "黒魔", 320, 301, 120, 60, 300, "254", 80, 160, "黒魔道士", 999, "召喚系", 999, { 一時的状態: "魔無効" }),
        new 敵情報(1, "ﾐﾆﾓﾝ", 350, 301, 500, 200, 500, "245", 66, 66, "ﾐﾆﾃﾞｰﾓﾝ", 999, "召喚系", 999, { 状態異常: "混乱" }),
        new 敵情報(1, "ｽﾗｲﾑまどう", 260, 384, 180, 50, 400, "013", 100, 150, "闇魔道士", 999, "ﾊｸﾞﾚﾒﾀﾙ", 999)
      ]);
      new 封印戦情報("全てを呪う者", 6, "暗黒の盾", 12, ステータス.ＨＰ, 300, true, [
        空配列,
        空配列,
        ["天馬のたづな", "天空の盾と兜", "宝物庫の鍵"]
      ], [
        new 敵情報(undefined, "暗黒の剣", 100_000, 99_999, 500, 200, 250, "707", 6000, 3000, "暗黒騎士", 999, "召喚系", 999, { 命中率: 900, 最大ＭＰ: 999_999, 一時的状態: "攻反撃" }),
        new 敵情報(undefined, "暗黒の盾", 100_000, 99_999, 300, 600, 250, "708", 7000, 4000, "魔王", 999, "召喚系", 999, { 命中率: 900, 最大ＭＰ: 999_999, 一時的状態: "魔反撃" })
      ], [
        new 敵情報(1, "悪魔の剣", 350, 301, 500, 200, 150, "620", 200, 50, "悪魔", 999, "ﾊﾞｰｻｰｶｰ", 999, { 一時的状態: "攻反撃" }),
        new 敵情報(1, "闇の剣", 350, 301, 500, 200, 150, "621", 200, 50, "暗黒騎士", 99, "ｱｻｼﾝ", 999, { 一時的状態: "攻反撃" }),
        new 敵情報(1, "呪の剣", 350, 301, 500, 200, 150, "622", 200, 50, "剣士", 999, "魔剣士", 999, { 一時的状態: "攻反撃" }),
        new 敵情報(1, "悪魔の盾", 350, 301, 200, 500, 200, "623", 150, 100, "悪魔", 999, "堕天使", 999, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "呪の盾", 350, 301, 200, 500, 200, "624", 150, 100, "ﾀﾞｰｸｴﾙﾌ", 999, "ﾐﾆﾃﾞｰﾓﾝ", 999, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "闇の盾", 350, 301, 200, 500, 200, "625", 150, 100, "闇魔道士", 999, "青魔道士", 999, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "魔王の剣", 350, 301, 400, 400, 300, "626", 200, 100, "魔王", 999, "召喚士", 999, { 一時的状態: "攻反撃" })
      ]);
      new 封印戦情報("全てを支配する者", 6, "ﾄﾞｰﾙﾏｽﾀｰ", 12, new クエスト参加条件(ステータス.ＨＰ, 200, true), [
        空配列,
        空配列,
        [
          "天馬のたづな",
          ...new 連続("天空の盾と兜", 2),
          "宝物庫の鍵"
        ]
      ], [
        new 敵情報(undefined, "ﾄﾞｰﾙﾏｽﾀｰ", 150_000, 999_999, 500, 250, 350, "705", 8000, 4000, "妖精", 999, "ﾄﾞｰﾙﾏｽﾀｰ", 999, { 命中率: 1000, 一時的状態: "100倍", 状態異常: "全封", 最大ＭＰ: 9_999_999 })
      ], 空配列);
      new 封印戦情報("二重世界", 6, "闇のｸﾘｽﾀﾙ", 12, ステータス.ＨＰ, 200, true, [
        空配列,
        空配列,
        [
          "小さなﾒﾀﾞﾙ", "天馬のたづな",
          ...アイテム.名前範囲("ｼﾙﾊﾞｰｵｰﾌﾞ", "ﾊﾟｰﾌﾟﾙｵｰﾌﾞ"),
          "宝物庫の鍵"
        ]
      ], [
        new 敵情報(undefined, "闇のｸﾘｽﾀﾙ", 150_000, 99_999, 500, 300, 300, "706", 4000, 3000, "召喚系", 999, "召喚系", 999, { 命中率: 900, 最大ＭＰ: 999_999, 一時的状態: "魔反撃" })
      ], [
        new 敵情報(1, "悪魔の鏡", 300, 301, 400, 300, 300, "570", 99, 50, "悪魔", 999, "ものまね士", 999, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "呪いの鏡", 300, 301, 400, 300, 300, "571", 99, 50, "ﾀﾞｰｸｴﾙﾌ", 999, "ものまね士", 999, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "暗黒の鏡", 300, 301, 400, 300, 300, "572", 99, 50, "暗黒騎士", 999, "ものまね士", 999, { 一時的状態: "魔反撃" }),
        new 敵情報(1, "月夜の鏡", 300, 301, 400, 300, 300, "573", 99, 50, "光魔道士", 999, "ものまね士", 999, { 一時的状態: "魔反撃" }),
      ]);
      new 封印戦情報("全てを爆発させる者", 6, "ﾎﾞﾏｰ", 12, ステータス.ＨＰ, 200, true, [
        空配列,
        ["ｽﾃﾃｺﾊﾟﾝﾂ"],
        [
          "爆弾石",
          ...new 連続("ﾌｧｲﾄ一発", 2),
          ...new 連続("ｴｯﾁな本", 4),
          ...new 連続("天馬のたづな", 2)
        ]
      ], [
        new 敵情報(undefined, "ﾎﾞﾏｰ", 60_000, 99_999, 450, 250, 150, "652", 5000, 1, "遊び人", 999, "召喚系", 999, { 最大ＭＰ: 999_999, 一時的状態: "大爆発", 状態異常: "するぞ" })
      ], [
        new 敵情報(1, "爆弾岩", 150, 42, 300, 300, 50, "080", 90, 5, "自爆系", 20, "無職", 30),
        new 敵情報(1, "爆弾王", 300, 42, 400, 300, 100, "579", 180, 20, "自爆系", 20, "無職", 30),
        new 敵情報(1, "ﾎﾞﾑ", 200, 42, 350, 60, 400, "071", 100, 50, "青魔道士", 20, "無職", 30),
        new 敵情報(1, "ﾋﾞｯｸﾎﾞﾑ", 400, 42, 450, 120, 280, "577", "青魔道士", 30, "無職", 30),
        new 敵情報(1, "ﾁﾋﾞﾎﾞﾑ", 50, 42, 300, 900, 900, "208", 100, 1, "自爆系", 20, "無職", 30, { 一時的状態: "魔無効" }),
        new 敵情報(1, "ｷﾗｰﾎﾞﾑ", 100, 42, 400, 700, 900, "209", 150, 10, "自爆系", 20, "無職", 30)
      ]);
      new 封印戦情報("闇でおおいつくす者", 6, "魔人のﾂﾎﾞ", 12, ステータス.ＨＰ, 400, false, [
        空配列,
        空配列,
        [
          ...new 連続("小さなﾒﾀﾞﾙ", 3),
          "天馬のたづな",
          ...アイテム.名前範囲("天馬のたづな", "ﾊﾟｰﾌﾟﾙｵｰﾌﾞ"),
          "宝物庫の鍵"
        ]
      ], [
        new 敵情報(undefined, "魔人のﾂﾎﾞ", 80_000, 99_999, 300, 400, 250, "605", 2500, 2000, "召喚系", 999, "召喚系", 999, { 命中率: 800, 最大ＭＰ: 999_999, 一時的状態: "攻軽減" })
      ], [
        new 敵情報(1, "青魔人", 250, 300, 380, 50, 150, "606", 100, 70, "武闘家", 999, "無職", 20, { 一時的状態: "攻反撃" }),
        new 敵情報(1, "赤魔人", 250, 300, 380, 50, 150, "607", 100, 70, "戦士", 999, "無職", 20, { 一時的状態: "攻反撃" }),
        new 敵情報(1, "黒魔人", 250, 300, 380, 50, 150, "608", 100, 70, "魔人", 999, "無職", 20, { 一時的状態: "攻反撃" }),
        new 敵情報(1, "白魔人", 250, 300, 380, 50, 150, "609", 100, 70, "ﾓﾝｸ", 999, "無職", 20, { 一時的状態: "攻反撃" })
      ]);
      new 封印戦情報("悪の城", 6, "悪の城", 12, ステータス.ＨＰ, 200, false, [
        空配列,
        空配列,
        [
          ...new 連続("小さなﾒﾀﾞﾙ", 2),
          ...アイテム.名前範囲("薬草", "ﾎﾋﾞｯﾄ"),
          ... new 連続("天馬のたづな", 2),
          ...アイテム.名前範囲("身代わり人形", "禁じられた果実"),
          ...アイテム.名前範囲("小人のﾊﾟﾝ", "復活の草"),
          "宝物庫の鍵"
        ]
      ], [
        new 敵情報(undefined, "悪の城", 30_000, 99_999, 150, 150, 100, "603", 1800, 2000, "召喚系", 999, "召喚系", 999, { 命中率: 800, 最大ＭＰ: 999_999, 一時的状態: "攻軽減" })
      ], [
        new 敵情報(1, "ﾐﾗｰﾅｲﾄ", 150, 94, 150, 100, 150, "520", 50, 50, "ものまね士", 999),
        new 敵情報(1, "地獄の鎧", 166, 66, 116, 66, 66, "240", 66, 66, "騎士", 40, "無職", 30),
        new 敵情報(1, "地獄の騎士", 166, 66, 166, 66, 66, "223", 66, 66, "魔剣士", 50, "暗黒騎士", 20),
        new 敵情報(1, "ﾌﾞﾙｰﾅｲﾄ", 120, 85, 150, 60, 50, "519", 50, 30, "竜騎士", 50, "無職", 20),
        new 敵情報(1, "ﾌﾞﾗｯｸﾅｲﾄ", 196, 96, 196, 96, 96, "524", 96, 96, "ﾊﾞｰｻｰｶｰ", 999, "暗黒騎士", 20)
      ]);
      new 封印戦情報("無限に増殖する者", 6, "ｽﾗｲﾑﾎﾞｯｸｽ", 12, ステータス.ＨＰ, 100, false, [
        空配列,
        空配列,
        [
          ...アイテム.名前範囲("薬草", "へんげの杖"),
          "天馬のたづな",
          ...アイテム.名前範囲("身代わり人形", "禁じられた果実"),
          ...アイテム.名前範囲("小人のﾊﾟﾝ", "復活の草"),
          "宝物庫の鍵"
        ]
      ], [
        new 敵情報(undefined, "ｽﾗｲﾑﾎﾞｯｸｽ", 15_000, 9_999, 60, 0, 0, "600", 1500, 500, "召喚系", 999, { 命中率: 300, 最大ＭＰ: 99_999, 一時的状態: "攻軽減" })
      ], [
        new 敵情報(1, "ﾌﾞﾁｽﾗｲﾑ", 20, 0, 36, 0, 20, "001", 6, 3, undefined, undefined, "無職", 20),
        new 敵情報(1, "ｽﾗｲﾑ", 25, 0, 40, 0, 20, "002", 9, 4, undefined, undefined, "無職", 20),
        new 敵情報(1, "ｽﾗｲﾑﾍﾞｽ", 30, 0, 45, 5, 25, "003", 10, 5, undefined, undefined, "無職", 20),
        new 敵情報(1, "ﾊﾞﾌﾞﾙｽﾗｲﾑ", 40, 52, 45, 10, 30, "020", 15, 10, "猛毒系", 20),
        new 敵情報(1, "ﾎｲﾐｽﾗｲﾑ", 40, 65, 35, 40, 20, "010", 20, 15, "僧侶", 6),
        new 敵情報(1, "ｽﾗｲﾑまどう", 40, 114, 30, 0, 45, "013", 24, 11, "闇魔道士", 16),
        new 敵情報(1, "ﾒﾀﾙｽﾗｲﾑ", 6, 51, 60, 2500, 1500, "004", 250, 10, "ｽﾗｲﾑ", 3, "逃げ出す", 0, { 一時的状態: "魔無効" })
      ]);
      new 封印戦情報("罪と罰", 4, undefined, 12, ステータス.ＨＰ, 200, true, [
        空配列,
        空配列,
        [
          ...アイテム.名前範囲("天馬のたづな", "ﾊﾟｰﾌﾟﾙｵｰﾌﾞ"),
          ...new 連続("宝物庫の鍵", 2)
        ]
      ], [
        new 敵情報(1, undefined, 50, 50, 2, 2, 2, undefined, 30, 30, undefined, undefined, { 一時的状態: "大防御" })
      ], 空配列); // TODO
    }
  }

  class クエスト参加条件 {
    constructor(ステータス名, 閾値, 以上か以下か) {

    }

    を満たしている() {

    }
  }

  // new 敵情報(,""),
  class 敵情報 {
    constructor(出現率, 名前, ＨＰ, ＭＰ, 攻撃力, 守備力, 素早さ, アイコン, 経験値, 所持金, 現職名, 現職SP, 前職) {

    }
  }

  class ダンジョン情報 extends 冒険場所の情報 {
    constructor(名前, 階層リスト, イベントリスト) {

    }

    マップを取得(現在x, 現在y, 視認可能距離) {

    }

    static 初期化() {
      new ダンジョン情報("クルクの洞窟", new ダンジョン階層情報(undefined, 20, ["プニプニ平原", "キノコの森"], `
◇◇◇◇宝
◆◆ボ◆◆
◇◇◇◇◇
隠◆◆◆◇
◇◇始◇◇
`, `
◇◇◇◇宝
◆◆ボ◆◆
◇◇◇◇◇
◇◆◆◆隠
◇◇始◇◇
`, `
◇隠◇◇宝
◇◆ボ◆◆
◇隠◇◇◇
◇◆◆◆◇
◇◇始◇◇
`, `
◇◆◇◇宝
◇◆ボ◆◆
◇隠◇◇◇
◇◆◆◆◇
◇◇始◇◇
`, `
宝◇◇◇◇
◆◆ボ◆◆
◇◇◇◇◇
◆◆◆◆◇
◇◇始◇◇
`, `
宝◇◇◇◇
◆◆ボ◆◆
◇◇◇◇◇
◇◆◆◆◆
◇◇始◇◇
`),
        空配列
      );
      new ダンジョン情報("レヌール城", new ダンジョン階層情報(undefined, 50, ["幽霊城"], `
宝ボ◇扉◇◆◇◆鍵
◆◆◆◆◇◇◇◆◇
◇◇◇◆◇◆◇◆◇
◇◆◇◇◇◆◇◇◇
◇◆隠◆◆◆◆◆◇
◇◆◇◇◇◇◇◆◇
◇◇◇◆始◆◇◇◇
◆隠◆◆◆◆◆◆隠
◆◇◇◇宝◇◇◇◇
`, `
宝ボ◇扉◇◇◇◇◇
◆◆◆◆◆◇◆◆◇
◆◇◇◇◆◇◆◆◇
◇◇◆◇◇◇◇◇◇
◇◆◆◆◇◆隠◆◇
◇◇鍵◆◇◆宝隠◇
◇◆◆◆◇◆◆◆◇
◇◆◇◇◇◇◇◆◇
◇◇◇◆始◆◇◇◇
`, `
◆鍵◆◇◇◇◇◆１
◆◇◆◇◆◆◇◆隠
◇◇◇◇◆◇◇◇◇
◇◆◆◆◆◇◆◆◇
◇◇◇始◇◇◇◆◇
◇◆◆◇◆◆◆◆扉
◇◆◆◇◇◇◆◆◇
◆◆◇◇◆◇◇◆ボ
１隠◇◆◆◆鍵◆宝
`, `
１◆◇◇◇◇◇隠１
隠◆◇◆扉◆◇◆◆
◇◇◇◆ボ◆◇◇◇
◇◆◆◆宝◆◆◆◇
◇◇◇◆◆◆◇◇◇
◇◆◇◇始◇◇◆◆
◇◆◇◆◇◆◆◆鍵
◇◆◇◆◇◇◇◆◇
鍵◆◇◇◇◆◇◇◇
`, `
１◆◇◇始◇◇◇◇
隠◇◇◆◇◆◆◆◇
◇◇◆◆◇◇◇◆◇
◇◆◆◇◇◆◇◆◇
◇◇◇◇◆◆◇◇◇
鍵◆◆◇◇◇◇◆◇
◆◆扉◇◆◆◇◆◇
宝ボ◇◆◆◇◇◆隠
◆◆◆◆鍵◇◆◆１
`, `
◇◇◇◇鍵◇◇◇◇
◇◆◆◆◆◆◆◆◇
◇◆◇◇◇◇◇◇◇
◇◇◇◆始◆◆◆隠
◇◆◆◆◆◆◇◇◇
◇◇◇◇◇◇◇◆◇
◇◆◇◆扉◆◇◇◇
◆◆◇◆ボ◆◇◆隠
１隠鍵◆宝◆◇◆１
`, `
◇◇◇◇１◇◇◇◇
◇◆◆◆◆◆◆◆◇
◇◆◇◇◇◇◇◇◇
◇◇◇◆始◆◆◆◆
◇◆◆◆◆◆◇◇◇
◇◇◇◇◇◇◇◆◇
◇◆扉◆◇◆◇◇◇
◇◆◇◆◆◆◇◆隠
鍵◆◇ボ宝◆鍵◆１
`), new Map([
        ["１", new ダンジョンイベント種類("１", true, undefined, "一度きりの宝(2箇所)")],
        ["扉", new ダンジョンイベント種類("扉", false, undefined, (使用者, イベントリスト) => {
          if (使用者.職業名 === "盗賊") {
            if (使用者.メッセージ) {
              $com += "<br />$m{mes}";
            }
            使用者.NPCに話させる("$mは細いナイフと針金のようなもので、扉のカギ穴をｶﾞﾁｬｶﾞﾁｬした！…ｶﾞﾁｬﾝｯ！なんと、扉が開いたようだ！");
          }
          else if (イベントリスト.has("鍵")) {
            使用者.NPCに話させる("$mは拾ったカギをトビラ扉に差し込んでみた！…ｺﾞｺﾞｺﾞｺﾞｺﾞ…重い音をたてて扉が開いていく！");
          }
          else {
            使用者.NPCに話させる("$mは扉を押したり引いたりしてみたが、ビクともしない…");
            return false;
          }
          return true;
        })]
      ]));
      new ダンジョン情報("トース塔",
        new ダンジョン階層情報("１階", 30, ["海辺の洞窟", "地獄の砂浜"], `
凸,7◇
7◆◇
◇◇◇
◆◆◇
始◇◇
`, `
凸7,◇
7◆◇
◇◆◇
◇◆◇
◇始◇
`, `
凸7◇
◆◆◇
◇◇◇
◇◆◆
◇◇始
`), new ダンジョン階層情報("２階", 40, ["海辺の洞窟", "地獄の砂浜", "魔術師の塔"], `
◇◇◇
◇◆◇
◇◇◇
◇◆穴
◇8凸
`, `
◇◇◇
◇◆◇
◇◇◇
穴◆◇
凸8,◇
`, `
◇◇◇
◆◆◇
◇◇◇
◇◆穴
◇8凸
` /*, `
◇◇◇
◆◆◇
◇◇◇
穴◆◇
凸8◇
`*/), new ダンジョン階層情報("４階[宝物庫]", 50, ["海辺の洞窟", "地獄の砂浜", "魔術師の塔", "荒野の獣道"], `
◆◇◆
◇◇◇
◇◇◇
穴宝穴
宝◇宝
`/*, 未使用のため省略 */));
      new ダンジョン情報("迷いの森", new ダンジョン階層情報(undefined, 60, ["魔術師の塔", "荒野の獣道", "マグマ山", "妖精の森"], `
才◇◇◇◇◇◇◇通
◇◆◇◆２◆◇◆◇
◇◇宝◆◇◆ボ◇◇
◇◆◆◆◇◆◆◆◇
◇１◇◇始①◇◇◇
◇◆◆◆②◆◆◆◇
◇罠通◆◇◆財◇◇
◇◆◇◆◇◆罠◆◇
ボ◇◇◇◇◇◇◇玉
`, `
ボ◇◇◇◇◇◇◇才
◇◆◇◆◇◆◇◆◇
◇◇通◆◇◆宝罠◇
◇◆◆◆②◆◆◆◇
◇◇◇①始◇◇１◇
◇◆◆◆◇◆◆◆◇
◇罠財◆◇◆ボ◇◇
◇◆◇◆２◆◇◆◇
玉◇◇◇◇◇◇◇通
`, `
ホ◇◇◇◇◇◇◇財
◇◆罠◆◇◆◇◆◇
◇◇ぼ◆◇◆玉◇◇
◇◆◆◆②◆◆◆◇
◇◇◇①始◇◇１◇
◇◆◆◆◇◆◆◆◇
◇◇才◆◇◆ボ罠◇
◇◆◇◆２◆◇◆◇
宝◇◇◇◇◇◇◇ほ
`, `
通◇◇◇◇◇◇◇玉
◇◆◇◆◇◆◇◆◇
◇◇ボ◆◇◆財罠◇
◇◆◆◆②◆◆◆◇
◇◇◇①始◇◇１◇
◇◆◆◆◇◆◆◆◇
◇◇宝◆◇◆通◇◇
◇◆◇◆２◆罠◆◇
才◇◇◇◇◇◇◇ボ
`, `
罠◇◇◇◇◇◇◇◇
◇◆◇◆◇◆◇◆◇
◇◇宝◆◇◆ボ◇◇
◇◆◆◆◇◆◆◆◇
◇◇通◇始◇通◇◇
◇◆◆◆◇◆◆◆◇
◇◇ボ◆◇◆財罠◇
◇◆◇◆◇◆◇◆◇
ホ◇◇◇◇◇◇◇玉
`, `
ホ◇◇◇◇◇◇◇玉
◇◆◇◆◇◆◇◆◇
◇宝ぼ◆路◆宝◇◇
◇◆◆◆◇◆◆◆◇
◇◇通◇始◇通◇◇
◇◆◆◆◇◆◆◆◇
◇◇宝◆路◆ボ◇◇
◇◆◇◆◇◆◇◆◇
◇◇◇◇◇◇◇◇罠
`, `
１◇◇◇◇◇◇◇宝
◇◆◇◆◇◆霧◆◇
◇◇ボ◆路◆民◇◇
◇◆◆◆◇◆◆◆◇
◇◇通◇始◇通◇◇
◇◆◆◆◇◆◆◆◇
◇◇宝◆路◆①◇◇
◇◆◇◆◇◆◇◆◇
罠◇◇◇◇◇◇◇ボ
`, `
ボ◇◇◇◇◇◇◇玉
◇◆霧◆◇◆◇◆◇
◇◇民◆路◆財◇◇
◇◆◆◆◇◆◆◆◇
◇◇通◇始◇通◇◇
◇◆◆◆◇◆◆◆◇
◇◇宝◆路◆ボ◇◇
◇◆◇◆◇◆◇◆◇
◇◇◇◇◇◇◇◇罠
`)); // TODO 「宝」をマップ上に表示するか
      new ダンジョン情報("死の大迷路", new ダンジョン階層情報(undefined, 70, [], `
始掲◇◇◇◇◆◇ボボ宝
◆◆◇◆◆◇◆◇◆宝宝
◇◇◇◆◇◇◆◇◆◆◆
◇◆◆◆◇◆◆◇◆◇◇
◇◇◇◆◇癒◆◇◇◇◆
◆◆◇◆◆◆◆◆◆◇◆
◇◇◇◇◇◇◇◇◆◇◇
◇◆◆◇◆◇◆◇◇◇◆
◇◆◆◇◆◇◆◆◆◆◆
◇◇◇◇◆◇◇◇◇◇癒
`, `
始掲◇◇◇◇◆◇ボボ宝
◆◆◇◆◆◇◆◇◆◆宝
◇◇◇◆◇◇◆◇◇◆宝
◇◆◆◆◇◆◆◆◇◆◆
◇◇◇◆◇◇◇◆◇◇◇
◆◆◇◆◆◆◇◆◆◇◆
◇◇◇◇◆◇◇◇◆◇◇
◇◆◆◇◆◇◆◇◇◇◆
◇◆◆◇◆◇◆◆◆◆◆
◇◇◇◇◆◇◇◇◇◇癒
`, `
始掲◇◇◇◇◆◇ボボ宝
◆◆◇◆◆◇◆◇◆◆宝
◇◇◇◆◇◇◆◇◇◆宝
◇◆◆◆◇◆◆◆◇◆◆
◇◇◇◆◇◇◇◆◇◇◇
◆◆◇◆◆◆◇◆◆◆◇
◇◇◇◇◆◇◇◇◆◆◇
◇◆◆◇◆◇◆◇◇◆◇
◇◆◆◇◆◇◆◆◆◆◇
◇◇癒◇◆◇◇◇◇◇◇
`, `
始掲◇◇◇◇◆◇ボボ宝
◆◆◇◆◆◇◆◇◆宝宝
◇◇◇◆◇◇◆◇◆◆◆
◇◆◆◆◇◆◆◇◆◇◇
◇◇◇◆◇癒◆◇◇◇◆
◆◆◇◆◆◆◆◆◆◇◇
◇◇◇◇◇◇◇◇◆◇◆
◇◆◆◆◆◆◆癒◆◇◇
◇◆◆◇◇◇◆◆◆◆◇
◇◇◇◇◆◇◇◇◇◇◇
`, `
始掲◇◇◇◇◆宝宝宝ボ
◆◆◇◆◆◇◆◆◆◆ボ
◇◇◇◆◇◇◆◇癒◆◇
◇◆◆◆◇◆◆◇◆◆◇
◇◇◇◆◇癒◆◇◇◇◇
◆◆◇◆◆◆◆◆◆◆◇
◇◇◇◇◇◇◇◇◆◇◇
◇◆◆◇◆◆◆癒◆◇◆
◇◆◆◆◆◇◆◆◆◇◆
◇◇◇◇◇◇◇◇◇◇◇
`, `
始掲◇◇◇◇◆◇ボボ宝
◆◆◇◆◆◇◆◇◆◆宝
◇◇◇◆◇◇◆◇◇◆宝
◇◆◆◆◇◆◆◆◇◆◆
◇◇◇◆◇◇◇◆◇◇◇
◆◆◇◆◆◆◇◆◆◇◆
◇◇◇◇◇◇◇◆◇◇◇
◇◆◆◆◆◆◆◆◇◆◆
◇◆◇◇◇◇◇◆◇◆癒
◇◇◇◆◇◆◇◇◇◇◇
`, `
始掲◇◇◇◇◆◇ボボ宝
◆◆◇◆◆◇◆◇◆◆宝
◇◇◇◆◇◇◆◇◇◆宝
◇◆◆◆◇◆◆◆◇◆◆
◇◇◇◆◇◇◇◆◇◇◇
◆◆◇◆◆◆◇◆◆◆◇
◇◇◇◇◇◇◇◆癒◆◇
◇◆◆◆◆◆◆◆◇◆◇
◇◆◇◇◇◇◇◆◇◆◇
◇◇◇◆◇◆◇◇◇◇◇
`));
      new ダンジョン情報("風の神殿", new ダンジョン階層情報(undefined, 60, [], `
始◇◇◇◇壁毒◆宝◇矢
◇◆◆◆矢◆◆◆◆◆◇
◇◆◇◇◇◇◇◇◇◆◇
◇◆◇◆◆◆◇◆◇◆◇
◇壁◇◆操◆◇◆◇◇◇
◇◆◇◆◇◇◇◆◆◇◆
◇毒◇◆壁◆◆◆◆◇◇
◇◆◇◆壁◆宝◆◇◇壁
◇◇◇◆壁壁ボ◆本◆宝
`, `
始◇◇◇◇壁矢壁宝◇毒
◇◆◆毒◆◆◆◆◆◆◇
◇◆◇◇◇◇◇◇◇◆◇
◇毒◇◆◆◆◇◆◇◆◇
◇◆◇◆操◆◇◆◇◇◇
◇◇◇◆◇◇◇◆◇◆◇
◇◆◇◆◆◆壁◆◇◆◇
◇◆矢◆宝◆壁◆◇壁壁
◇◇◇◆ボ壁壁◆本◆宝
`, `
宝◇◇◇操◇◇◇◇◇◇
◇◆◆◆◆◆◆◆◆◆◇
◇◆始◇◇◇◇◆◇毒◇
◇◆◇◆◆◆◇◇◇◆◇
◇◆◇◆◇◇◇壁◇◇◇
矢◆◇◆◇◆◆毒◆宝◆
◇壁◇毒◇本◆◆◆◆◆
◇◆◇◆◇◆◆◇壁壁◆
◇◇◇◇◇◇◇◇◆ボ宝
`, `
宝◇◇◇◇矢◇◇◇◇◇
◇◆◆◆◆◆◆◆◆◆◇
◇◆始◇◇◇◇◆◇◇◇
操◆◇◆◆◆◇◇◇◆毒
◇◆◇◆◇◇◇壁◇◇◇
◇矢◇◆◇◆◆宝◆毒◆
◇◆◇◆◇本◆◆◆◆◆
◇◆◇◆矢◆◆◇壁壁◆
◇毒◇◇◇◇◇◇◆ボ宝
`));
      new ダンジョン情報("風の神殿", new ダンジョン階層情報(undefined, 30, [], `
◇宝◇
◆ボ◆
◆◇◆
◇◇◇
A◆B
◇大◇
◆◇◆
◆◇◆
◇◇◇
C◆D
◇金◇
◆◇◆
◆◇◆
◇◇◇
E◆F
◇罠◇
◆◇◆
◆始◆
`, `
宝◇宝
◆ボ◆
◆◇◆
◇◇◇
A,◆B,
◇箱◇
◆◇◆
◆◇◆
◇◇◇
C,◆D,
◇強◇
◆◇◆
◆◇◆
◇◇◇
E,◆F,
◇猫◇
◆◇◆
◆始◆
`, `
宝◇宝
◆ボ◆
◆◇◆
◇◇◇
A,◆B,
◇ぼ◇
◆◇◆
◆◇◆
◇◇◇
◆◆D,
◇壁◇
◆◇◆
◆◇◆
◇◇◇
E,◆F,
◇運◇
◆◇◆
◆始◆
`, `
宝◇宝
◆ボ◆
◆◇◆
◇◇◇
A,◆B,
◇5,◇
◆◇◆
◆◇◆
◇◇◇
C,◆◆
◇壁◇
◆◇◆
◆◇◆
◇◇◇
E,◆F,
◇運◇
◆◇◆
◆始◆
`, `
宝◇宝
◆ボ◆
◆◇◆
◇◇◇
A,◆B,
◇小◇
◆◇◆
◆◇◆
◇◇◇
C,◆D,
◇独◇
◆◇◆
◆◇◆
◇◇◇
E,◆F,
◇財◇
◆◇◆
◆始◆
`), new Map([
  ["大", ダンジョンイベント種類.案内板("←Yes【小さいより大きい方がいい】No→")],
  ["金", ダンジョンイベント種類.案内板("←Yes【命よりお金が大事】No→")],
  ["罠", ダンジョンイベント種類.案内板("←Yes【ワナは大嫌いだ】No→")],
  ["箱", ダンジョンイベント種類.案内板("←Yes【宝箱が大好きだ】No→")],
  ["猫", ダンジョンイベント種類.案内板("←Yes【猫より犬派だ】No→")],
  ["強", ダンジョンイベント種類.案内板("←Yes【強い敵と戦いたい】No→")],
  ["ぼ", ダンジョンイベント種類.案内板("←ボス【立て札】宝→")],
  ["壁", ダンジョンイベント種類.案内板("←壁【立て札】行き止まり→")],
  ["運", ダンジョンイベント種類.案内板("←実力【立て札】運→")],
  ["独", ダンジョンイベント種類.案内板("←全員【立て札】１人→")],
  ["財", ダンジョンイベント種類.案内板("←宝【立て札】お金→")],
  ["小", ダンジョンイベント種類.案内板("←小さい【立て札】大きい→")],
      ]));
      new ダンジョン情報("風の神殿", new ダンジョン階層情報(undefined, 60, [], `
◇◆宝◆宝
痺◇ボ◆ぼ
◆◇◆◆◇
◇◇◇◇◇
◇◆◇◆痺
◇◆ス◆◇
◇◆◇◆◆
◇◇◇◇◆
岩◆◆◇◆
◇◆熱◇ホ
宝◆◇◆操
`));      // TODO
    }
  }

  class ダンジョン階層情報 {
    constructor(名前, 限界ターン, 敵と宝の参照元のクエストリスト, マップ候補リスト) {

    }
  }

  class ダンジョンイベント種類 {
    constructor(タイル, 一度きり, 表示) {
      this.#一度きり = 一度きり;
      this.#表示 = 表示;
    }

    get 一度きり() { return this.#一度きり; }

    #一度きり;
    #表示;

    static 案内板(内容) {
      return new ダンジョンイベント種類(undefined, true, undefined, (行動者) => {
        行動者.現在値.NPCに話させる(クラス付きテキスト("strong", 内容));
        /* TODO 改行 */
      });
    }

    static #隠し通路 = new ダンジョンイベント種類("隠", false, "■");
    static #宝箱 = new ダンジョンイベント種類("宝", true, undefined);
    static #鍵 = new ダンジョンイベント種類("ボ", true, "★");
  }

  class ダンジョン案内板 {

  }

  class ダンジョンタイル情報 {

    は無効化済み(発火済みイベントリスト) {
      return 発火済みイベントリスト.has(this) && this.#イベント種類.一度きり;
    }

    通過時(通過者, 発火済みイベントリスト) {
      if (this.は無効化済み(発火済みイベントリスト)) {
        return;
      }
    }

    表示用関数(発火済みイベントリスト) {
      return (this.#表示 === undefined || this.は無効化済み(発火済みイベントリスト)) ? "通路" : this.#表示; // TODO
    }

    #イベント種類;
    #表示;
  }

  class 宝タイル情報 extends ダンジョンタイル情報 {

  }

  class 宝箱 {
    constructor(接頭辞, 画像ID) {
      this.#接頭辞 = 接頭辞;
      this.#画像ID = 画像ID;
    }

    static ランダム召喚(アイテム名) {
      // アイテム名決定のとこでオーブと道具確率up
      const
        _宝箱 = ランダムな1要素(宝箱.#一覧),
        _アイテム = アイテム.一覧(アイテム名);
      return 戦闘メンバー.オブジェクトから({
        _名前: `${_宝箱.#接頭辞}宝箱`,
        _アイコン: `mon/${_宝箱.画像ID}.gif`,
        _ＨＰ: 1000,
        _守備力: 1000,
        _一時的状態: 一時的状態.一覧("魔無効"),
        _経験値: (_アイテム instanceof 武器) ? 1
          : (_アイテム instanceof 防具) ? 2
            : 3,
        _所持金: _アイテム.種類別IDを取得() // TODO
      })
    }

    static 初期化() {
      宝箱.#一覧 = [
        new 宝箱("普通の", 900),
        new 宝箱("大きい", 901),
        new 宝箱("小さい", 902),
        new 宝箱("黒い", 903),
        new 宝箱("青い", 904),
        new 宝箱("古い", 905),
        new 宝箱("丸い", 906)
      ];
    }

    #接頭辞;
    #画像ID;

    static #一覧;
  }

  class 戦闘メンバー extends キャラクター {
    constructor({
      名前, アイコン, 色, 最終更新日時, 場所別ID, 経験値 = 0, 所持金 = 0,
      ＨＰ = 2, ＭＰ = 0, 攻撃力 = 0, 守備力 = 0, 素早さ = 0,
      現在ＨＰ, 現在ＭＰ, 現在攻撃力, 現在守備力, 現在素早さ,
      現職名, 前職名, 命中率 = 戦闘メンバー.命中率初期値
    }) {
      super(名前, アイコン, 色, 最終更新日時, 場所別ID);
      this._ステータス = new ステータス(ＨＰ, ＭＰ, 攻撃力, 守備力, 素早さ, 現在ＨＰ, 現在ＭＰ, 現在攻撃力, 現在守備力, 現在素早さ);
      this.#現職 = 職業.一覧(現職名);
      this.#前職 = 職業.一覧(前職名);
    }

    チャット書き込み予約(内容, 宛て先) {
      this.現在地.チャット書き込み予約(...arguments);
    }

    スキル実行(スキル名) {
      return (this.現職.スキルを取得(スキル名) ?? this.前職.スキルを取得(スキル名))?.実行();
    }

    * メンバー全員(気にしないかまたは敵か味方か = undefined, 気にしないかまたは死んでいるメンバーだけか以外か = undefined, 自分を除く = false) {
      for (const メンバー of this.現在地.メンバー全員()) {
        if (
          (気にしないかまたは敵か味方か === undefined || !(気にしないかまたは敵か味方か ^ メンバー.は敵()))
          && (気にしないかまたは死んでいるメンバーだけか以外か === undefined || (気にしないかまたは死んでいるメンバーだけか以外か ^ メンバー.は死んでいる()))
          && (!自分を除く || メンバー.名前 !== あなた.名前)
        ) {
          yield メンバー;
        }
      }
    }

    ランダムスキル() {
      // TODO ＭＰとSP
      ランダムな1要素([...this.現職.スキル, ...this.前職.スキル]).実行();
    }

    ステータスを表示() {
      return `<br />${this.名前} ${this.ステータス.出力()}`;
    }

    リセット(テンションをリセットする = true) {
      this._状態異常 = undefined;
      this._一時的状態 = undefined;
      if (テンションをリセットする) {
        this._テンション = undefined;
      }
      this.命中率を初期値に(null);
      this.ステータス.再計算(this._武器, this._防具, this._道具);
    }

    モシャス(戦闘メンバー) {
      this._ステータス = ステータス.オブジェクトから(戦闘メンバー.ステータス);
      this.#現職 = 戦闘メンバー.#現職;
      this.#前職 = 戦闘メンバー.#前職;
      this.アイコン = 戦闘メンバー._アイコン;
    }

    はメタル耐性を持っている(テキストを表示する = true) {
      const 耐性がある = this.ステータス.守備力.基礎値 > 999;
      if (耐性がある && テキストを表示する) {
        this.耐性();
      }
      return 耐性がある;
    }

    は即死耐性を持っている(テキストを表示する = true) {
      const 耐性がある = this.ステータス.ＨＰ.現在値 > 999 || this.はメタル耐性を持っている(false);
      if (耐性がある && テキストを表示する) {
        this.耐性();
      }
      return 耐性がある;
    }

    はスーパーハイテンションになれる() {
      return (this._レベル >= 25) && (this._レベル > 19 + Math.random() * 50);
    }

    は死んでいる() {
      return this.ステータス.ＨＰ.現在値 <= 0;
    }

    は敵(あなた) {
      return あなた._色 !== this._色;
    }

    はメンバー一覧に表示する(あなた) {
      return !this.は死んでいる() || (this.は敵(あなた) && !this.はNPC());
    }

    はNPC() {
      return 戦闘メンバー.#NPCかどうか.test(this.名前);
    }

    宝箱の中身を取得() {
      if (!戦闘メンバー.#宝箱かどうか.test(this.名前)) {
        return undefined;
      }
      if (this._経験値 === 0) {
        return null;
      }
      return アイテム.経験値とゴールドからアイテム名を取得(this._経験値, this._ゴールド);
    }

    においを取得() {
      const 中身 = this.宝箱の中身を取得();
      if (中身 === undefined) {
        this.チャット書き込み予約(`${this.名前}は ${ランダムな1要素(this.におい候補)} においがする`);
      }
      else {
        this.チャット書き込み予約(`宝箱の中身は ${中身 ?? 戦闘メンバー.#空の宝箱の中身} のようだ…`);
      }
    }

    何もしない() {
      this.チャット書き込み予約("しかし、何も起こらなかった…");
    }

    素早さ対抗判定(相手) {
      return 確率(1 / 3)
        && (Math.random() * this.ステータス.素早さ.現在値 >= Math.random() * 相手.ステータス.素早さ.現在値 * 3);
    }

    回避(確率) {
      if (確率(確率)) {
        使用者.チャット書き込み予約(`${this.名前}はかわした！`);
        return true;
      }
      return false;
    }

    耐性(末尾三点リーダ = true) {
      this.チャット書き込み予約(`${this.名前}にはきかなかった${末尾三点リーダ ? "…" : "！"}`);
    }

    ＨＰ回復(回復量, 蘇生 = false) {
      if (!蘇生 && this.は死んでいる()) {
        return;
      }
      回復量 = Math.trunc(回復量);
      this.ステータス.ＨＰ.現在値 += 回復量;
      this.チャット書き込み予約(`<b>${名前}</b>のＨＰが <span class="heal">${回復量}</span> 回復した！`);
    }

    必要なら生き返ってからＨＰ全回復() {
      this.チャット書き込み予約(this.は死んでいる() ? `${名前}のＨＰが<span class="heal">全回復</span>した！` : `<span class="revive">${名前}が生き返った！</span>`);
      this.ステータス.ＨＰ.基礎値へ();
    }

    蘇生(ＨＰ割合, _確率, 全体技か) {
      if (!確率(_確率)) {
        const 表示文 = 全体技か ? 強調テキスト("しかし、", this.名前, "は生き返らなかった…")
          : `しかし、${this.名前}は生き返らなかった…`;
        this.チャット書き込み予約(表示文);
        return;
      }
      const 表示文 = 全体技か ? 強調テキスト("なんと、", this.名前, `が ${クラス付きテキスト("heal", "生き返り")} ました！`)
        : _確率 !== 1 ? `なんと、${クラス付きテキスト("revive", `${this.名前}が生き返りました！`)}`
          : クラス付きテキスト("revive", `${this.名前}が生き返った！`);
      this.チャット書き込み予約(表示文);
      this.ステータス.ＨＰ.基礎値へ(ＨＰ割合);
    }


    死亡(耐性を無視する = false, 経験値を配る = true) {
      if (!耐性を無視する && (this.は即死耐性を持っている())) {
        return;
      }
      // TODO
    }

    即死(命中率) {
      if (this.は死んでいる() || this.は即死耐性を持っている() || this.回避(1 - 命中率)) {
        return;
      }
      this.チャット書き込み予約(`${this.名前}は死んでしまった！`);
      this.死亡();
    }

    ダメージ(ダメージ量, 表示文章取得関数, 死亡時表示文 = "をたおした！") {
      ダメージ量 = Math.trunc(ダメージ量);
      if (ダメージ量 <= 0) {
        ダメージ量 = 整数乱数(2, 1, true);
      }
      this.ステータス.ＨＰ.現在値 -= ダメージ量;
      if (表示文章取得関数 !== null) {
        this.チャット書き込み予約(表示文章取得関数?.() ?? `<b>${this.名前}</b>に <span class="damage">${ダメージ量}</span> のダメージ！`);
      }
      if (this.は死んでいる()) {
        this.ステータス初期化();
        if (死亡時表示文 !== null) {
          this.チャット書き込み予約(クラス付きテキスト("die", `${this.名前}${死亡時表示文}`));
        }
      }
    }

    ＨＰを1にする() {
      this.チャット書き込み予約(`${this.名前}は${クラス付きテキスト("st_down", "生命力を失った")}！`);
      this.ステータス.ＨＰ.現在値 = 1;
    }

    ＭＰ回復(回復量) {
      回復量 = Math.trunc(回復量);
      this.チャット書き込み予約(強調テキスト(空文字列, this.名前, `のＭＰが ${クラス付きテキスト("heal", 回復量)} 回復した！`));
      this.ステータス.ＭＰ.現在値 += 回復量;
    }

    ステータスを上げる() {

    }

    ステータスを下げる(現在ステータス名, 効果係数, 追加効果か = false) {
      if (this.はメタル耐性を持っている(!追加効果か) || ((現在ステータス名 === "ＨＰ" || 現在ステータス名 === "攻撃力") && this.は即死耐性を持っている(!追加効果か))) {
        return;
      }
      const ステータス = this.ステータス[ステータス名];
      if (0) { // TODO
        if (!追加効果か) {
          this.チャット書き込み予約(`${this.名前}にはこれ以上効果がないようだ…`);
        }
        return;
      }
      let 効果値 = ステータス.現在値 * 効果係数;
      if (現在ステータス名 === "ＭＰ" && 効果値 > 150 * あなた.テンション) {
        効果値 = int(rand(50) + 100 * あなた.テンション);
      }
      this.ステータス[ステータス名].現在値 -= 効果値;
      this.チャット書き込み予約(`${this.名前}の<span class="st_down">${ステータス名}が ${効果値} さがった！</span>`);
      return 効果値;
    }

    命中率を下げる(効果係数, 追加効果か = false) {
      if (this.はメタル耐性を持っている(!追加効果か)) {
        return;
      }
      if (this.命中率 < 50) {
        this.チャット書き込み予約(`${this.名前}にはこれ以上効果はないようだ…`);
        return;
      }
      const 効果値 = this._命中率 * 効果係数;
      this._命中率 = max(this._命中率 - 効果値, 50);
      this.チャット書き込み予約(`${this.名前}の<span class="st_down">命中率が ${効果値} さがった！</span>`);
      return 効果値;
    }

    命中率を初期値に(文章表示用関数) {
      this._命中率 = 戦闘メンバー.命中率初期値;
      if (文章表示用関数 === null) {
        return;
      }
      this.チャット書き込み予約(クラス付きテキスト("st_up", 文章表示用関数?.(this.名前) ?? `${this.名前}は心を落ちつかせ命中率が回復した`));
    }

    一時的状態にする(一時的状態名, 表示文) {
      this.一時的状態 = 一時的状態.一覧(一時的状態名);
      if (表示文 !== null) {
        const 文章 = 表示文 !== undefined ? クラス付きテキスト("tmp", `${this.戦闘メンバー.名前}${表示文}`)
          : this.一時的状態.文章を表示(this);
        this.チャット書き込み予約(文章);
      }
    }

    状態異常にする(状態異常名, テンションを解除する = true, テキストを表示する = true) {
      this.状態異常 = 状態異常.一覧(一時的状態名);
      if (テンションを解除する) {
        this.テンションを消費();
      }
      if (テキストを表示する) {
        this.チャット書き込み予約(クラス付きテキスト("state", `${this.名前}の状態が${this.状態異常名}になりました！`));
      }
    }

    状態異常を解除(状態異常名) {
      if (状態異常名 !== undefined && this.状態異常.名前 !== 状態異常名) {
        this.チャット書き込み予約(`<span class="heal">${this.名前}には効果がないようだ…</span>`);
        return;
      }
      this.チャット書き込み予約(クラス付きテキスト("heal", `${this.名前}の${this.状態異常.名前}が治りました！`));
      this.状態異常 = undefined;
    }

    テンションを上げる(スーパーハイテンションになれる = this.はスーパーハイテンションになれる()) {
      const 次 = this._テンション.次を取得(スーパーハイテンションになれる);
      if (次 === undefined || (次.名前 === "Sﾊｲﾃﾝｼｮﾝ" && !スーパーハイテンションになれる)) {
        this.チャット書き込み予約(`${this.名前}のテンションはこれ以上あがらないようだ`);
        return;
      }
      this._テンション = 次;
      this._テンション.上昇時用出力();
    }

    テンションを消費() {
      if (this.テンション === undefined) {
        return 1;
      }
      const 倍率 = this.テンション.倍率;
      this.テンション = undefined;
      return 倍率;
    }

    ヘッダー用出力() {
      const 断片 = this.ステータス.ヘッダー用出力();
      断片.appendChild(document.createTextNode(
        ` ${this.現職.toString()}${this.前職 ?
          ` ${this.前職.toString()}` : 空文字列}${this._道具 ?
            ` E：${this._道具.名前}` : 空文字列}`
      ));
      return 断片;
    }

    場所用出力() {
      const
        全体枠 = document.createElement("div"),
        名前枠 = document.createElement("div"),
        ＨＰ表示 = document.createElement("div"),
        ＨＰゲージ枠 = document.createElement("div"),
        ＨＰゲージ内容 = document.createElement("div"),
        アイコン = document.createElement("img");
      全体枠.classList.add("メンバー");
      if (this.一時的状態 || this.状態異常) {
        if (this.一時的状態) {
          名前枠.appendChild(クラス付きテキスト("state", this.一時的状態.名前));
        }
        if (this.状態異常) {
          名前枠.appendChild(クラス付きテキスト("tmp", this.状態異常.名前));
        }
      }
      else if (this.テンション) {
        名前枠.appendChild(this.テンション.メンバー用出力());
      }
      const ＨＰ = this.ステータス.ＨＰ;
      ＨＰ表示.append(
        ＨＰ.現在値 > 999 ? 戦闘メンバー.#即死耐性所持時の現在ＨＰ表示 : ＨＰ.現在値,
        クラス付きテキスト("仕切り線", " / "),
        ＨＰ.基礎値 > 999 ? 戦闘メンバー.#即死耐性所持時の現在ＨＰ表示 : ＨＰ.基礎値,
      );
      アイコン.src = `resource/icon/${this.死んでいる() ? "chr/099.gif" : this.アイコン名}`;
      アイコン.alt = this.名前;
      ＨＰゲージ枠.classList.add("gage_back2");
      ＨＰゲージ内容.style.width = `${Math.trunc(this.ステータス.ＨＰ.現在値 / this.ステータス.ＨＰ.基礎値 * 100)}%`;
      ＨＰゲージ枠.appendChild(ＨＰゲージ内容);
      チャットフォーム.文字列登録イベントを追加(全体枠, `>${this.名前} `);
      全体枠.append(ＨＰ表示, ＨＰゲージ枠, ` ${this.名前} `, アイコン);
      return 全体枠;
    }

    #ステータス減少チェック(下限) {
      if (this.はメタル耐性を持っている(!追加効果か) || ((ステータス名 === "ＨＰ" || ステータス名 === '攻撃力') && this.は即死耐性を持っている(!追加効果か))) {
        return true;
      }
      if (this.ステータス[ステータス名] < 下限) {
        this.チャット書き込み予約(`${this.名前}にはこれ以上効果はないようだ…`);
      }
      return false;
    }

    get 名前() { return this.名前; }
    get ステータス() { return this._ステータス; }

    _ステータス;
    _命中率;

    #現職;
    #前職;

    static #NPCかどうか = new RegExp(/^@/);
    static #宝箱かどうか = new RegExp(/^@.+宝箱.$/);
    static #即死耐性所持時の現在ＨＰ表示 = "???";
    static #命中率初期値 = 95;
    static #におい候補 = ["いい", "おいしそうな", "バラの", "あまい", "変な", "やばい", "さわやかな", "ワイルドな"];
    static #空の宝箱の中身 = "からっぽ";
  }

  class モンスター定義 extends 戦闘メンバー {
    constructor() {
    }

    召喚() {
      return new 戦闘メンバー(this);
    }

    #戦闘メンバー;
  }

  // 省略表記のものは基本的に初期化時に評価・決定されるので、ランダムのものは関数の中に書く必要がある(例: 僧侶の＠バギ)
  class 戦士 extends 転職可能な職業 {
    constructor() {
      super(6, 1, 3, 5, 2, [
        スキル.単体攻撃("かぶとわり", 5, 5, 属性.攻, ステータス.攻撃力, 0.9),
        new スキル("かばう", 8, 0, (使用者, 対象者) => { new 一時的状態を付与(); }), // TODO
        スキル.自身(バフスキル, "ちからをためる", 25, 8, 属性.攻, ステータス.攻撃力, 1),
        スキル.全体非依存攻撃("がんせきなげ", 50, 5, 属性.攻, 90),
        new スキル("まじんぎり", 80, 10, (使用者, 対象者) => { new 単体ダメージ(使用者, 対象者, 属性.攻, 確率(1 / 2) ? 使用者.ステータス.攻撃力 * 3 : 20); })
      ]);
    }
  }

  class 剣士 extends 転職可能な職業 {
    constructor() {
      super(4, 1, 4, 2, 3, [
        スキル.単体攻撃("しんくうぎり", 5, 3, 属性.攻, ステータス.素早さ, 1.5),
        スキル.単体(状態異常スキル, "みねうち", 10, 4, 属性.攻, 80, "動封"),
        スキル.自身一時的状態("うけながし", 20, 5, "受流し"),
        new スキル("かばう", 30),
        スキル.単体攻撃("メタルぎり", 50, 6, 属性.無, ステータス.攻撃力, 0.4),
        スキル.単体攻撃("はやぶさぎり", 80, 12, 属性.攻, ステータス.素早さ, 2.2), // TODO
        スキル.全体攻撃("さみだれぎり", 100, 21, 属性.攻, ステータス.素早さ, 1),
      ]);
    }
  }

  class 騎士 extends 転職可能な職業 {
    constructor() {
      super(6, 2, 2, 6, 2, [
        new スキル("かばう", 1),
        スキル.自身(バフスキル, "まもりをかためる", 5, 2, 属性.攻, ステータス.守備力, 0.4),
        new スキル("すてみ", 15, 5, (使用者, 対象者) => {
          使用者.チャット書き込み予約(クラス付きテキスト("tmp", `${使用者}は守りを気にせずすてみで攻撃！`));
          new 単体ダメージ(使用者, 対象者, 使用者.ステータス.攻撃力 * 2);
          使用者.一時的状態にする("２倍", null);
        }),
        スキル.自身一時的状態("だいぼうぎょ", 25, 3, "大防御"),
        スキル.全体(バフスキル, "スクルト", 20, 7, 属性.魔, ステータス.守備力, 0.25),
        new スキル("メガザル", 60, 1, 技.メガザル),
        スキル.全体攻撃("グランドクロス", 80, 18, 属性.攻, ステータス.守備力, 1.5)
      ]);
    }
  }

  class 武闘家 extends 転職可能な職業 {
    constructor() {
      super(6, 2, 2, 6, 2, [
        スキル.自身命中率リセット("せいしんとういつ", 1, 0),
        スキル.自身(バフスキル, "みかわしきゃく", 5, 3, 属性.攻, ステータス.素早さ, 0.4),
        スキル.単体攻撃("ひざげり", 14, 4, 属性.攻, ステータス.攻撃力, 1.2),
        スキル.単体(状態異常スキル, "あしばらい", 25, 3, 属性.攻, 75, "動封"),
        スキル.単体(即死スキル, "きゅうしょづき", 45, 11, 属性.攻, 19),
        スキル.単体攻撃("せいけんづき", 70, 15, 属性.攻, ステータス.攻撃力, 1.5),
        スキル.連続攻撃(3, 5, "ばくれつけん", 100, 20, 属性.攻, ステータス.攻撃力, 0.8)
      ]);
    }
  }

  class 僧侶 extends 転職可能な職業 {
    constructor() {
      super(3, 5, 2, 3, 3, [
        スキル.単体(バフスキル, "スカラ", 1, 3, 属性.魔, ステータス.守備力, 0.4),
        スキル.単体(状態異常回復スキル, "キアリー", 3, 2, 属性.魔, "猛毒"),
        スキル.単体(回復スキル, "ホイミ", 6, 3, 属性.魔, 30),
        new スキル("バギ", 12, 4, (使用者) => { 全体技.ダメージ(使用者, 30 + 25 * Math.random(), 属性.魔, true); }),
        スキル.単体(回復スキル, "ベホイミ", 24, 10, 属性.魔, 90),
        new スキル("バギマ", 45, 10, (使用者) => { 全体技.ダメージ(使用者, 40 + 25 * Math.random(), 属性.魔, true); }),
        スキル.単体(蘇生スキル, "ザオラル", 60, 20, 属性.無, 50, 50),
        スキル.単体(回復スキル, "ベホマ", 100, 30, 属性.魔, 999)
      ])
    }
  }

  class 魔法使い extends 転職可能な職業 {
    constructor() {
      super(3, 6, 1, 1, 3, [
        スキル.単体攻撃("メラ", 1, 2, 属性.魔, 20),
        スキル.単体(デバフスキル, "ルカニ", 4, 4, 属性.魔, ステータス.守備力, 0.4),
        スキル.全体非依存攻撃("ギラ", 8, 5, 属性.魔, 25),
        スキル.全体(命中率低下スキル, "マヌーサ", 14, 7, 属性.魔, 0.2),
        スキル.単体非依存攻撃("メラミ", 20, 8, 属性.魔, 70),
        スキル.単体(状態異常スキル, "ラリホー", 30, 8, 属性.魔, 65, "眠り"),
        スキル.全体非依存攻撃("ベギラマ", 55, 11, 属性.魔, 60),
        スキル.単体非依存攻撃("メラゾーマ", 90, 30, 属性.魔, 220)
      ])
    }
  }

  class 商人 extends 転職可能な職業 {
    constructor() {
      super(5, 2, 3, 4, 3, [
        new スキル("まもりをかためる", 2),
        new スキル("ゴールドハンマー", 7, 1, (使用者, _対象者) => {
          const { 対象者, 威力, 完了 } = new 単体ダメージ(使用者, _対象者, 使用者.ステータス.攻撃力 * 0.8);
          if (!完了) {
            return;
          };
          const 金額 = Math.trunc(威力 * 0.1) + 5;
          あなた._所持金.収支(金額);
          使用者.チャット書き込み予約(`${金額}を手に入れました！`)
        }),
        スキル.全体(命中率低下スキル, "すなけむり", 12, 6, 属性.息, 0.2),
        new スキル("とうぞくのはな", 20, 0, (使用者, 対象者) => { 対象者.においを取得(); }),
        スキル.反動つき単体攻撃("たいあたり", 35, 4, 属性.攻, ステータス.守備力, 1.6, 0.07),
        スキル.全体(状態異常スキル, "メダパニダンス", 65, 7, 属性.踊, 60, "混乱"),
        new スキル("メガンテ", 80, 1, (使用者, 対象者) => {
          使用者.チャット書き込み予約(クラス付きテキスト("die", `${使用者.名前}は自爆した！`));
          new 全体技(使用者, 即死スキル, 1, 属性.無, 60);
          使用者.死亡();
          使用者.ステータス.ＭＰ.現在値 = 1;
        })
      ])
    }
  }

  class 遊び人 extends 転職可能な職業 {
    constructor() {
      super(2, 1, 1, 1, 3, [
        new スキル("ねる", 1, 0, (使用者) => {
          new 回復スキル(使用者, 使用者.ステータス.ＨＰ.基礎値 * 0.5);
          使用者.チャット書き込み予約(`${使用者.名前}は眠りだした`);
          使用者.状態異常にする("眠り", false, false);
        }),
        スキル.いたずら("なげきっす", 4, "麻痺"),
        スキル.いたずら("パフパフ", 8, "動封"),
        スキル.いたずら("きけんなあそび", 12, "猛毒"),
        new スキル("ちょうはつ", 4, 0, (使用者) => {
          for (const メンバー of 対象者.メンバー全員(undefined, false, true)) {
            if (確率(1 / 2)) {
              メンバー.テンションを上げる();
            }
          }
        }),
        new スキル("からかう", 24, 0, (使用者, 対象者) => {
          if (対象者 !== undefined) {
            対象者.テンションを上げる();
            return;
          }
          new からかう(使用者);
        })
      ]);
    }
  }

  class 盗賊 extends 転職可能な職業 {
    constructor() {
      super(3, 3, 3, 1, 5, [
        スキル.単体(デバフスキル, "ボミエ", 3, 3, 属性.魔, ステータス.素早さ, 0.4),
        スキル.単体(バフスキル, "ピオラ", 6, 3, 属性.魔法, ステータス.素早さ, 0.4),
        スキル.全体(状態異常スキル, "いしつぶて", 12, 7, 属性.息, 45, "混乱"),
        new スキル("とうぞくのはな", 20),
        スキル.全体(状態異常スキル, "あまいいき", 35, 9, 属性.息, 35, "眠り"),
        new スキル("インパス", 50, 1, 技.ライブラ),
        スキル.追加効果付き単体攻撃("まひこうげき", 70, 8, 属性.攻, ステータス.攻撃力, 1.2, 状態異常スキル, 30, "麻痺"),
        スキル.単体(封印, "アーマーブレイク", 90, 15, 属性.攻, ステータス.守備力)
      ]);
    }
  }

  class 羊飼い extends 転職可能な職業 {
    constructor() {
      super(4, 3, 2, 4, 2, [
        new スキル("ねる", 1), // TODO クラス付きテキスト("state", `${使用者.名前}は眠りだした`)
        new スキル("スカラ", 1),
        new スキル("たいあたり", 35),
        new スキル("ベホイミ", 20),
        スキル.全体(状態異常スキル, "ねむりのうた", 40, 9, 属性.歌, 45, "眠り"),
        スキル.自身(一時的状態, "マホキテ", 60, 1, 属性.魔, "魔吸収"), // TODO 魔封判定はあるが混乱判定はない
        new スキル("ウールガード", 80, 7, (使用者) => { new バフスキル(使用者, 使用者, 属性.無, ステータス.守備力, 0.5); 使用者.一時的状態にする("魔軽減"); }),
        スキル.連続攻撃(2, 4, "どとうのひつじ", 100, 20, 属性.攻, ステータス.素早さ, 1.6)
      ]);
    }
  }

  class 弓使い extends 転職可能な職業 {
    constructor() {
      super(4, 3, 3, 2, 4, [
        スキル.単体(状態異常スキル, "かげぬい", 属性.攻, 80, "動封"),
        new スキル("せいしんとういつ", 10),
        スキル.全体攻撃("でたらめや", 20, 8, 属性.攻, ステータス.素早さ, 1.4),
        スキル.ＭＰ吸収("ようせいのや", 40, 4, 属性.攻, 0.15),
        スキル.追加効果付き単体攻撃("フラッシュアロー", 60, 6, 属性.攻, ステータス.攻撃力, 1.2, 命中率低下スキル, 0.07),
        スキル.追加効果付き単体攻撃("ラリホーアロー", 90, 20, 属性.攻, ステータス.攻撃力, 1.1, 状態異常スキル, 55, "眠り"),
        スキル.連続攻撃(3, 4, "みだれうち", 110, 24, 属性.攻, ステータス.攻撃力, 0.85)
      ]);
    }
  }

  class 魔物使い extends 転職可能な職業 {
    constructor() {
      super(4, 2, 2, 3, 2, [
        スキル.全体非依存攻撃("ひのいき", 3, 2, 属性.息, 18),
        スキル.全体(状態異常スキル, "もうどくのきり", 10, 7, 属性.息, 60, "猛毒"),
        スキル.全体非依存攻撃("かえんのいき", 18, 5, 属性.息, 50),
        スキル.追加効果付き単体攻撃("しびれうち", 32, 11, 属性.攻, ステータス.攻撃力, 1.1, 状態異常スキル, 40, "麻痺"),
        スキル.単体(状態異常スキル, "なめまわす", 50, 5, 属性.攻, 85, "動封"),
        スキル.全体非依存攻撃("はげしいほのお", 80, 14, 属性.息, 90),
        new スキル("そうりゅううち", 110, 12, (使用者, 対象者) => {
          for (let i = 0; (i < 2) && !使用者.は死んでいる(); i += 1) {
            new 単体ダメージ(使用者, 対象者, 属性.攻, 使用者.ステータス.攻撃力.現在値 * 1.6);
          }
        })
      ]);
    }
  }

  class 吟遊詩人 extends 転職可能な職業 {
    constructor() {
      super(4, 4, 2, 3, 4, [
        スキル.全体(デバフスキル, "ふしぎなうた", 5, 3, 属性.歌, ステータス.ＭＰ),
        スキル.全体(回復スキル, "いやしのうた", 15, 7, 属性.歌, 30),
        スキル.全体(状態異常回復スキル, "めざめのうた", 30, 5, 属性.歌, "眠り"),
        スキル.全体(バフスキル, "まもりのうた", 40, 6, 属性.歌, ステータス.守備力, 0.4),
        スキル.全体(状態異常スキル, "ねむりのうた", 60, 9, 属性.歌, 50, "眠り"),
        スキル.全体(バフスキル, "たたかいのうた", 90, 10, 属性.歌, ステータス.攻撃力, 0.6)
      ], 転職条件.性別("男"));
    }
  }

  class 踊り子 extends 転職可能な職業 {
    constructor() {
      super(3, 4, 3, 2, 5, [
        スキル.自身(バフスキル, "みかわしきゃく", 4, 3, 属性.踊, ステータス.素早さ, 0.4),
        スキル.単体(デバフスキル, "ふしぎなおどり", 9, 3, 属性.踊, ステータス.ＭＰ, 0.4),
        new スキル("うけながし", 16),
        スキル.全体攻撃("ムーンサルト", 30, 9, 属性.攻, ステータス.攻撃力, 0.8),
        new スキル("メガザルダンス", 45, 1, 技.メガザル), // TODO
        スキル.連続攻撃(2, 4, "つるぎのまい", 70, 16, 属性.踊, ステータス.攻撃力, 0.8),
        スキル.全体(回復スキル, "ハッスルダンス", 100, 12, 属性.踊, 140)
      ], 転職条件.性別("女"));
    }
  }

  class 黒魔道士 extends 転職可能な職業 {
    constructor() {
      super(3, 6, 1, 2, 3, [
        スキル.追加効果付き単体攻撃("ポイズン", 5, 6, 属性.魔, 30, 状態異常スキル, 80, "猛毒"), // TODO
        スキル.単体非依存攻撃("ファイア", 10, 5, 属性.魔, 35),
        スキル.単体(状態異常スキル, "スリプル", 20, 8, 属性.魔, "眠り", 55),
        スキル.単体(一時的状態スキル, "リフレク", 40, 7, 属性.魔, "魔反撃"),
        スキル.ＭＰ吸収("アスピル", 60, 3, 属性.魔, 0.2),
        スキル.非依存ＨＰ吸収("ドレイン", 80, 16, 属性.魔, 50, 150),
        スキル.単体非依存攻撃("フレア", 130, 40, 属性.魔, 260)
      ], 転職条件.性別("男"));
    }
  }

  class 白魔道士 extends 転職可能な職業 {
    constructor() {
      super(3, 5, 2, 2, 3, [
        スキル.単体(回復スキル, "ケアル", 5, 5, 属性.魔, 60),
        new スキル("ライブラ", 10, 2, 技.ライブラ),//TODO
        スキル.単体(状態異常スキル, "サイレス", 15, 6, 属性.魔, "魔封", 90),
        スキル.単体(回復スキル, "ケアルラ", 30, 18, 属性.魔, 180),
        スキル.単体(一時的状態スキル, "リレイズ", 60, 20, 属性.魔, "復活"),
        スキル.単体(一時的状態スキル, "シェル", 80, 5, 属性.魔, "魔軽減"),
        スキル.単体(蘇生スキル, "レイズ", 100, 40, 属性.魔, 0.25),
        スキル.単体非依存攻撃("ホーリー", 140, 35, 属性.魔, 180)
      ], 転職条件.性別("女"));
    }
  }

  class 聖騎士 extends 転職可能な職業 {
    constructor() {
      super(4, 2, 3, 5, 2, [
        new スキル("かばう", 10),
        new スキル("ホイミ", 20),
        スキル.全体(一時的状態スキル, "マジックバリア", 40, 6, 属性.魔, "魔軽減"), // TODO
        スキル.単体(状態異常回復スキル, "キアリク", 60, 5, 属性.魔, "麻痺"),
        new スキル("メガザル", 100),
        new スキル("グランドクロス", 130, 20),
        スキル.単体(蘇生スキル, "ザオリク", 160, 80, 属性.魔, 1),
      ], new 転職条件(["戦士", "剣士", "騎士", "暗黒騎士"], "男"));
    }
  }

  class 天使 extends 転職可能な職業 {
    constructor() {
      super(4, 5, 2, 3, 4, [
        new スキル("キアリー", 5),
        スキル.全体(状態異常スキル, "おどりふうじ", 15, 6, 属性.踊, 70, "踊封"),
        new スキル("めざめのうた", 30),
        スキル.単体(一時的状態スキル, "マホカンタ", 50, 5, 属性.魔, "魔反撃"),
        スキル.全体蘇生("てんしのうたごえ", 70, 27, 属性.無, 0.5, 1 / 2),
        スキル.全体(回復スキル, "ベホマラー", 90, 25, 属性.魔, 120),
        new スキル("ザオリク", 120)
      ], new 転職条件(["僧侶", "遊び人", "羊飼い", "踊り子", "白魔道士"], "女"));
    }
  }

  class 闇魔道士 extends 転職可能な職業 {
    constructor() {
      super(3, 6, 2, 1, 3, [
        スキル.全体(デバフスキル, "ルカナン", 4, 7, 属性.魔, ステータス.守備力, 0.25),
        new スキル("マホカンタ", 8),
        スキル.全体(状態異常スキル, "メダパニ", 16, 10, 属性.魔, 50, "混乱"),
        スキル.単体(即死スキル, "ザキ", 25, 14, 属性.魔, 20),
        スキル.全体(状態異常スキル, "マホトーン", 40, 10, 属性.魔, 70, "魔封"),
        スキル.全体非依存攻撃("ベギラゴン", 60, 18, 属性.魔, 125),
        スキル.ＭＰ吸収("マホトラ", 70, 2, 属性.魔, 0.25),
        スキル.全体(即死スキル, "ザラキ", 110, 32, 属性.魔, 20)
      ], new 転職条件(["魔法使い", "遊び人", "黒魔道士", "光魔道士"], "男"));
    }
  }

  class 悪魔 extends 転職可能な職業 {
    constructor() {
      super(3, 4, 3, 6, 3, [
        スキル.単体(状態異常スキル, "さそうおどり", 4, 4, 属性.踊, 85, "動封"),
        スキル.追加効果付き単体攻撃("レディウィップ", 9, 6, 属性.攻, ステータス.攻撃力, 0.9, ＭＰ回復スキル), // TODO *0.1
        new スキル("マジックバリア", 16),
        new スキル("あまいいき", 20),
        new スキル("メダパニダンス", 36),
        スキル.全体(即死スキル, "しのおどり", 60, 24, 属性.踊, 17),
        スキル.追加効果付き単体攻撃("クィーンウィップ", 100, 18, 属性.攻, ステータス.攻撃力, 1.7, 回復スキル) // TODO *0.5
      ], new 転職条件(["魔法使い", "遊び人", "暗黒騎士"], "女"));
    }
  }

  class ﾊﾞｰｻｰｶｰ extends 転職可能な職業 {
    constructor() {
      super(6, 1, 5, 3, 2, [
        new スキル("たいあたり", 10),
        スキル.自身一時的状態("うけながし", 20, undefined, "受流し", " は攻撃を受流すかまえをとった"),
        スキル.全体(状態異常スキル, "おたけび", 40, 12, 属性.攻, 60, "動封"),
        new スキル("すてみ", 60),
        スキル.反動つき単体攻撃("もろはぎり", 80, 6, 属性.攻, ステータス.攻撃力, 1.6, 0.05),
        new スキル("みなごろし", 110, 9, (使用者) => {
          let 対象者 = 確率(1 / 4) ? 使用者.ランダムなメンバーを取得(false) : 使用者.ランダムなメンバーを取得(true);
          if (対象者.は死んでいる()) {
            対象者 = 使用者;
          }
          const 威力 = Math.trunc((使用者.ステータス.攻撃力.現在値 * 3 - 対象者.ステータス.守備力.現在値 * 0.4) * (0.9 + Math.random() * 0.3) * 使用者.テンションを消費());
          対象者.ダメージ(威力, undefined, "を倒した！");
        })
      ], 転職条件.職業と実績(["戦士", "武闘家", "魔物使い"], "モンスター討伐数", 201));
    }
  }

  class 暗黒騎士 extends 転職可能な職業 {
    constructor() {
      super(4, 3, 5, 1, 2, [
        new スキル("あんこく", 10, 5, (使用者, 対象者) => {
          const 技 = new 単体ダメージ(使用者, 対象者, 属性.攻, 使用者.ステータス.攻撃力.現在値 * 1.5);
          if (!技.完了 || 技.威力 <= 0) {
            return;
          }
          使用者.反動ダメージ(使用者.ステータス.ＨＰ > 999 ? 技.威力 * 0.1 : 使用者.ステータス.ＨＰ * 0.1);
        }),
        new スキル("めいやく", 20, 9, (使用者) => {
          const 断片 = document.createDocumentFragment();
          断片.append(`${使用者.名前}の`, クラス付きテキスト("st_down", `守備力が ${v} さがりました！`));
          使用者.ステータスを下げる(ステータス.守備力, 0.5, true); // 下限なし
          使用者.チャット書き込み予約(断片);
          new バフスキル(使用者, 使用者, 属性.無, ステータス.攻撃力, 1);
        }), // TODO
        スキル.全体(状態異常スキル, "ナイトメア", 40, 16, 属性.魔, 50, "混乱"),
        スキル.追加効果付き単体攻撃("ダークブレイク", 70, 10, 属性.攻, ステータス.攻撃力, 1.2, 命中率低下スキル, 0.1),
        new スキル("あんこくけん", 140, 40, (使用者, 対象者) => {
          const 技 = new 単体ダメージ(使用者, 対象者, 属性.攻, 使用者.ステータス.攻撃力.現在値 * 1.5);
          if (!技.完了 || 技.威力 <= 0) {
            return;
          }
          使用者.反動ダメージ(使用者.ステータス.ＨＰ > 999 ? 技.威力 * 0.2 : 使用者.ステータス.ＨＰ * 0.2);
        })
      ], 転職条件.職業と実績(["剣士", "騎士", "聖騎士", "悪魔", "魔人"], "プレイヤー撃退数", 51));
    }
  }

  class 竜騎士 extends 転職可能な職業 {
    constructor() {
      super(4, 1, 3, 4, 5, [
        スキル.単体攻撃("ジャンプ", 10, 5, 属性.攻, ステータス.素早さ, 1.8),
        new スキル("ドラゴンパワー", 30, 25, (使用者) => {
          new バフスキル(使用者, 使用者, 属性.攻, ステータス.攻撃力, 0.4);
          new バフスキル(使用者, 使用者, 属性.攻, ステータス.守備力, 0.4);
        }),
        スキル.追加効果付き単体攻撃("りゅうけん", 50, 18, 属性.攻, ステータス.攻撃力, 0.9, 回復スキル),
        new スキル("ハイジャンプ", 70, 14, (使用者, 対象者) => {
          new 単体ダメージ(使用者, 対象者, 属性.攻, 使用者.ステータス.素早さ.現在値 * 2.2);
          new 単体ダメージ(使用者, undefined, 属性.攻, 使用者.ステータス.素早さ.現在値 * 2.2);
        }),
        スキル.単体攻撃("グングニル", 130, 35, 属性.攻, ステータス.攻撃力, 1.4, true)
      ], new 転職条件(["盗賊", "弓使い", "忍者"]));
    }
  }

  class 魔剣士 extends 転職可能な職業 {
    constructor() {
      super(3, 5, 4, 2, 2, [
        スキル.単体攻撃("かえんぎり", 10, 6, 属性.攻, ステータス.攻撃力, 1.2),
        new スキル("メタルぎり", 30),
        スキル.単体(バフスキル, "バイキルト", 50, 16, 属性.魔, ステータス.攻撃力, 1),
        スキル.単体攻撃("いなずまぎり", 70, 14, 属性.攻, ステータス.攻撃力, 1.5),
        スキル.単体非依存攻撃("ギガスラッシュ", 130, 25, 属性.攻, 230)
      ], new 転職条件(["剣士", "魔法使い", "赤魔道士"]));
    }
  }

  class ﾓﾝｸ extends 転職可能な職業 {
    constructor() {
      super(5, 1, 4, 3, 3, [
        スキル.全体攻撃("まわしげり", 5, 8, 属性.攻, ステータス.攻撃力, 0.8),
        new スキル("チャクラ", 15, 3, (使用者) => { new 回復スキル(使用者, 使用者, 属性.攻, 100); 使用者.命中率を初期値に(null); }),
        new スキル("すてみ", 30, 15, (使用者, 対象者) => {
          使用者.チャット書き込み予約(クラス付きテキスト("st_down", `${使用者}は守りを気にせずすてみで攻撃！`));
          new 単体ダメージ(使用者, 対象者, 使用者.ステータス.攻撃力 * 2);
          使用者.一時的状態にする("２倍", null);
        }),
        スキル.自身一時的状態("カウンター", 50, 5, "攻反撃"),
        new スキル("だいぼうぎょ", 70),
        スキル.全体非依存攻撃("しんくうは", 90, 12, 属性.攻, 120),
        new スキル("におうだち", 110, 0, (使用者) => {
          for (const 味方 of 使用者.メンバー全員(false, undefined, true)) {
            味方.一時的状態にする("かばう", null);
          }
          使用者.一時的状態にする("かばい中");
        }),
        スキル.自身一時的状態("きしかいせい", 130, 7, "復活", "は死ぬ気のオーラにつつまれた！")
      ], new 転職条件(["武闘家", "魔物使い", "ﾊﾞｰｻｰｶｰ"]));
    }
  }

  class 忍者 extends 転職可能な職業 {
    constructor() {
      super(3, 3, 3, 2, 6, [
        new スキル("かえんのいき", 5),
        スキル.全体(状態異常スキル, "やけつくいき", 15, 10, 属性.息, 35, "麻痺"),
        new スキル("マヌーサ", 30),
        new スキル("もうどくのきり", 40),
        スキル.全体(バフスキル, "ピリオム", 50, 6, 属性.魔, ステータス.素早さ, 0.25),
        new スキル("きゅうしょづき", 65),
        スキル.自身(バフスキル, "しのびあし", 80, 10, 属性.無, ステータス.素早さ, 1),
        new スキル("アーマーブレイク", 110)
      ], new 転職条件(["盗賊", "弓使い", "竜騎士", "蟲師"]));
    }
  }


  class 風水士 extends 転職可能な職業 {
    constructor() {
      super(4, 3, 2, 4, 4, [
        new スキル("すなけむり", 5),
        スキル.単体非依存攻撃("かまいたち", 15, 5, 属性.無, 80),
        スキル.全体(デバフスキル, "ボミオス", 25, 6, 属性.魔, ステータス.素早さ, 0.3),
        スキル.単体非依存攻撃("ヒャダルコ", 40, 11, 属性.魔, 80),
        スキル.全体(状態異常回復スキル, "ザメハ", 55, 4, 属性.魔, "眠り"),
        スキル.全体一時的状態("おいかぜ", 70, 5, 属性.無, "息反撃"),
        スキル.全体非依存攻撃("マヒャド", 90, 27, 属性.魔, 160),
        スキル.単体(封印, "ウェポンブレイク", 110, 15, 属性.攻, ステータス.攻撃力),
      ], new 転職条件(["商人", "遊び人", "羊飼い"]));
    }
  }

  class 侍 extends 転職可能な職業 {
    constructor() {
      super(4, 2, 4, 3, 4, [
        new スキル("せいしんとういつ", 5), // TODO
        new スキル("みねうち", 15, 3), // TODO
        new スキル("うけながし", 20),
        new スキル("ぜになげ", 50, 0, (使用者) => { 全体技.ダメージ(使用者, 属性.攻, あなた.メンバー.収支(-100, true) ? 180 : 50, true) }), // TODO 
        スキル.自身一時的状態("しらはどり", 70, 4, "攻無効"),
        スキル.全体(状態異常スキル, "いあいぎり", 100, 20, 属性.攻, 65, "動封"),
        スキル.単体(即死スキル, "ざんてつけん", 140, 10, 属性.攻, 25)
      ], new 転職条件(["剣士", "魔剣士", "忍者"]));
    }
  }

  class 時魔道士 extends 転職可能な職業 {
    constructor() {
      super(3, 5, 1, 2, 4, [
        スキル.単体(デバフスキル, "スロウ", 10, 4, 属性.魔, ステータス.素早さ, 0.45),
        スキル.単体(バフスキル, "ヘイスト", 20, 4, 属性.魔, ステータス.素早さ, 0.45),
        スキル.非依存連続攻撃(2, 3, "コメット", 30, 14, 属性.魔, 50),
        スキル.全体(デバフスキル, "スロウガ", 50, 9, 属性.魔, ステータス.素早さ, 0.35),
        スキル.全体(バフスキル, "ヘイスガ", 70, 9, 属性.魔, ステータス.素早さ, 0.35),
        スキル.単体(デバフスキル, "グラビデ", 110, 30, 属性.魔, ステータス.ＨＰ, 0.5),
        スキル.非依存連続攻撃(4, 6, "メテオ", 150, 50, 属性.魔, 99)
      ], new 転職条件(["吟遊詩人", "踊り子", "黒魔道士", "白魔道士"]));
    }
  }

  class 赤魔道士 extends 転職可能な職業 {
    constructor() {
      super(4, 3, 4, 3, 3, [
        new スキル("ケアル", 10),
        new スキル("ファイア", 20),
        new スキル("シェル"),
        スキル.全体非依存攻撃("ファイラ", 60, 11, 属性.魔, 80),
        new スキル("リフレク", 80),
        new スキル("ケアルラ", 100),
        new スキル("リレイズ", 120),
        スキル.非依存連続攻撃(2, 2, "れんぞくまほう", 150, 40, 属性.魔, 180)
      ], new 転職条件(["黒魔道士", "白魔道士", "時魔道士"]));
    }
  }

  class 青魔道士 extends 転職可能な職業 {
    constructor() {
      super(3, 4, 2, 2, 5, [
        new スキル("じばく", 11, 11, (使用者, 対象者) => {
          使用者.チャット書き込み予約(クラス付きテキスト("die", `${使用者.名前}は自爆した！`));
          new 単体ダメージ(使用者, 対象者, 属性.魔, 使用者.ステータス.ＨＰ.現在値);
          使用者.死亡(true);
        }),
        new スキル("しのルーレット", 44, 4, (使用者, 対象者) => {
          // TODO
        }),
        new スキル("？？？？", 66, 18, (使用者, 対象者) => {
          const ＨＰ = 使用者.ステータス.ＨＰ;
          new 単体ダメージ(使用者, 対象者, 属性.魔, ＨＰ.基礎値 - ＨＰ.現在値 + 5);
        }),
        new スキル("マイティガード", 77, 34, (使用者) => {
          new 全体技(使用者, バフスキル, 1, 属性.魔, 0.5, ステータス.守備力);
          for (const 味方 of 使用者.メンバー全員(false, false)) {
            味方.一時的状態にする("魔軽減");
          }
        }),
        new スキル("ＭＰ４グラビガ", 94, 24, (使用者) => {
          // TODO 魔封チェック
          for (const メンバー of 使用者.メンバー全員(undefined, false)) {
            const 現在ＭＰ = メンバー.ステータス.ＭＰ.現在値;
            if (現在ＭＰ !== 0 && 現在ＭＰ % 4 === 0 && !メンバー.即死耐性を持っている()) {
              const ＨＰ = メンバー.ステータス.ＨＰ;
              ＨＰ.現在値 = Math.max(1, Math.trunc(ＨＰ.現在値 * 0.25));
              使用者.チャット書き込み予約(`${メンバー.名前}は<span class="st_down">ＨＰが1/4になった！</span>`); // TOSO
            }
          }
        }),
        new スキル("ホワイトウィンド", 121, 36, (使用者) => {
          new 全体技(使用者, 回復スキル, 1, 使用者.ステータス.ＨＰ.現在値);
        }),
        new スキル("ＭＰ５デス", 155, 25, (使用者) => {
          // TODO 魔封チェック
          for (const メンバー of 使用者.メンバー全員(undefined, false)) {
            const 現在ＭＰ = メンバー.ステータス.ＭＰ.現在値;
            if (現在ＭＰ !== 0 && 現在ＭＰ % 5 === 0 && !メンバー.即死耐性を持っている()) {
              メンバー.死亡();
              使用者.チャット書き込み予約(クラス付きテキスト("die", `${対象者}は死んでしまった！`));
            }
          }
        })
      ], new 転職条件(["遊び人", "吟遊詩人", "踊り子", "風水士"]));
    }
  }

  class 召喚士 extends 転職可能な職業 {
    constructor() {
      super(3, 6, 1, 2, 3, [
        new スキル("チョコボ", 5, 5, (使用者, 対象者) => {
          const 当たり = 確率(1 / 4);
          使用者.チャット書き込み予約(`＠${当たり ? "デブチョコボ" : "チョコボキック"}＠`);
          new 単体ダメージ(使用者, 対象者, 属性.魔, 当たり ? 100 : 30);
        }),
        new スキル("シルフ", 25, 10, (使用者) => {
          使用者.チャット書き込み予約("＠癒しの風＠");
          new 全体技(使用者, 1, 回復スキル, 属性.魔, 50);
        }),
        new スキル("ゴーレム", 50, 20, (使用者) => {
          使用者.状態異常.技発動時チェック({ 属性: 属性.魔 });
          使用者.チャット書き込み予約("＠守りの壁＠");
          for (const 味方 of 使用者.メンバー全員(false, false)) {
            味方.一時的状態にする("攻軽減");
          }
        }),
        new スキル("カーバンクル", 70, 30, (使用者) => {
          使用者.状態異常.技発動時チェック({ 属性: 属性.魔 });
          使用者.チャット書き込み予約("＠ルビーの光＠");
          for (const 味方 of 使用者.メンバー全員(false, false)) {
            味方.一時的状態にする("魔反撃", "は魔法の壁に守られた！");
          }
        }),
        new スキル("フェニックス", 100, 40, (使用者) => {
          使用者.状態異常.技発動時チェック({ 属性: 属性.魔 });
          使用者.チャット書き込み予約("＠転生の炎＠");
          for (const 味方 of 使用者.メンバー全員(false, true)) {
            味方.蘇生(0.15, 召喚士.#フェニックス);
          }
        }),
        new スキル("バハムート", 150, 50, (使用者) => {
          使用者.チャット書き込み予約("＠メガフレア＠");
          new 全体技(使用者, 1, 単体ダメージ, 属性.魔, 220);
        })
      ], new 転職条件(["闇魔道士", "悪魔", "時魔道士"]));
    }

    static #フェニックス(戦闘メンバー) {
      return クラス付きテキスト("revive", `${戦闘メンバー}が生き返った！`);
    }
  }

  class 賢者 extends 転職可能な職業 {
    constructor() {
      super(3, 5, 1, 2, 2, [
        new スキル("マジックバリア", 5),
        スキル.全体非依存攻撃("イオラ", 15, 12, 属性.魔, 70),
        スキル.全体一時的状態("フバーハ", 30, 7, 属性.魔, "息軽減"),
        new スキル("ベホマラー", 70),
        new スキル("バイキルト", 100),
        スキル.全体非依存攻撃("イオナズン", 130, 34, 属性.魔, 160),
        new スキル("ザオリク", 160)
      ], 遊び人だとアイテム消費免除の転職条件.アイテム("賢者の悟り"));
    }
  }

  class 勇者 extends 転職可能な職業 {
    constructor() {
      super(5, 2, 4, 4, 2, [
        new スキル("かばう", 10),
        スキル.単体非依存攻撃("ライデイン", 30, 15, 属性.魔, 110),
        スキル.自身(回復スキル, "めいそう", 60, 25, 属性.無, 300),
        スキル.全体非依存攻撃("ギガデイン", 90, 40, 属性.魔, 180),
        スキル.自身(一時的状態スキル, "アストロン", 120, 6, 属性.魔, "魔無効"), // 魔封判定はあるが混乱判定はない
        スキル.全体(回復スキル, "ベホマズン", 150, 80, 属性.魔, 999),
        new スキル("ミナデイン", 180, 30, (使用者, 対象者) => {
          new ミナデイン(使用者, 対象者, 属性.魔, 100, 15, 85);
        })
      ], 転職条件.アイテムと実績("勇者の証", "勇者熟練度", 5));
    }
  }

  class 魔王 extends 転職可能な職業 {
    constructor() {
      super(4, 5, 3, 4, 4, [
        new スキル("うけながし", 10), //TODO ＭＰ違い, 表記ゆれ
        new スキル("いてつくはどう", 30, 30, 技.全体リセット),
        new スキル("ザキ", 60),
        スキル.全体非依存攻撃("しゃくねつ", 90, 40, 属性.息, 180),
        new スキル("めいそう", 120),
        new スキル("アストロン", 150),
        スキル.全体非依存攻撃("ジゴスパーク", 180, 70, 属性.魔, 150, 状態異常スキル, 属性.魔, 20, "麻痺")
      ], 転職条件.アイテムと実績("邪神像", "魔王熟練度", 1));
    }
  }

  class ものまね士 extends 転職可能な職業 {
    constructor() {
      super(3, 3, 3, 3, 3, [
        ものまね士.#ものまね("おどる", 10, "踊", "踊る"),
        ものまね士.#ものまね("ぶれす", 20, "息", "息を吐く"),
        ものまね士.#ものまね("まほう", 40, "魔", "魔法を唱える"),
        ものまね士.#ものまね("こうげき", 60, "攻", "攻撃する"),
        new スキル("モシャス", 100, 50, (使用者, 対象者 = 使用者.ランダムなメンバーを取得()) => {
          if (対象者.は死んでいる() || 対象者.はメタル耐性を持っている(false) || 対象者.ステータス.ＨＰ.現在値 > 999) {
            return;
          }
          使用者.モシャス(対象者);
          使用者.チャット書き込み予約(クラス付きテキスト("st_up", `${使用者.名前}は${対象者.名前}に姿を変えました！`));
        })
      ], 転職条件.アイテム("ﾏﾈﾏﾈの心"));
    }

    static #ものまね(属性動作ひらがな, SP, 属性名, 属性動作) {
      return new スキル(`${属性動作ひらがな}`, SP, 5, (使用者) => {
        使用者.一時的状態にする(`${属性名}反撃`, null);
        const テキスト = クラス付きテキスト("tmp", `${使用者.名前}は${属性動作}まねをはじめた！`);
        使用者.チャット書き込み予約(テキスト);
      });
    }
  }

  class 結界士 extends 転職可能な職業 {
    constructor() {
      super(3, 5, 3, 5, 3, [
        new スキル("マホトーン", 5),
        new スキル("マホキテ", 10),
        new スキル("おどりふうじ", 15),
        new スキル("マジックバリア", 6),
        new スキル("マホカンタ", 40),
        スキル.単体(状態異常スキル, "じゅばく", 60, 7, 属性.無, 80, "攻封"),
        new スキル("めいそう", 80),
        new スキル("ふういん", 100, 15, (使用者, 対象者) => {
          new 封印2(使用者, 対象者, 属性.攻);
        })
      ], 転職条件.アイテム("精霊の守り"));
    }
  }

  class ﾊﾞﾝﾊﾟｲｱ extends 転職可能な職業 {
    constructor() {
      super(3, 4, 4, 1, 5, [
        new スキル("きゅうけつ", 10, 12, (使用者) => {
          // TODO
        }),
        new スキル("アスピル", 20),
        new スキル("アストロン", 30),
        new スキル("めいやく", 60), // TODO
        new スキル("あまいいき", 90),
        スキル.非依存ＨＰ吸収("ギガドレイン", 130, 37, 属性.魔,) // TODO
      ], 転職条件.アイテム("伯爵の血"));
    }
  }

  class ｽﾗｲﾑ extends 転職可能な職業 {
    constructor() {
      super(3, 4, 2, 3, 4, [
        new スキル("ギラ", 3),
        new スキル("スクルト", 7),
        new スキル("ホイミ", 11),
        new スキル("ルカナン", 16),
        new スキル("ザオラル", 50),
        new スキル("しゃくねつ", 99)
      ], 転職条件.アイテム("ｽﾗｲﾑの心"));
    }
  }

  class ﾊｸﾞﾚﾒﾀﾙ extends 転職可能な職業 {
    constructor() {
      super(1, 7, 1, 7, 7, [
        new スキル("メラミ", 25),
        new スキル("ベギラマ", 50),
        new スキル("マダンテ", 99, 1, (使用者) => {
          全体技.ダメージ(使用者, 属性.魔, 使用者.ステータス.ＭＰ.現在値 * 2);
          使用者.ステータス.ＭＰ.現在値 = 0;
        })
      ], 転職条件.アイテム("ﾊｸﾞﾚﾒﾀﾙの心"));
    }
  }

  class ﾄﾞﾗｺﾞﾝ extends 転職可能な職業 {
    constructor() {
      super(6, 1, 6, 6, 1, [
        スキル.全体非依存攻撃("つめたいいき", 10, 1, 属性.息, 15),
        スキル.全体非依存攻撃("こおりのいき", 30, 6, 属性.息, 55),
        スキル.全体非依存攻撃("こごえるふぶき", 60, 14, 属性.息, 115),
        new スキル("やけつくいき", 90, 9),
        スキル.全体非依存攻撃("かがやくいき", 120, 34, 属性.息, 195)
      ], 転職条件.アイテム("ﾄﾞﾗｺﾞﾝの心"));
    }
  }

  class ｱｻｼﾝ extends 転職可能な職業 {
    constructor() {
      super(3, 2, 5, 1, 6, [
        スキル.単体(状態異常スキル, "コンフュ", 15, 7, 属性.魔, 80, "混乱"),
        new スキル("サイレス", 30),
        new スキル("しのびあし", 55),
        スキル.追加効果付き単体攻撃("どくこうげき", 80, 4, 属性.攻, ステータス.攻撃力, 1.1, 状態異常スキル, 70, "猛毒"),
        スキル.追加効果付き単体攻撃("まひこうげき", 70, 8, 属性.攻, ステータス.攻撃力, 1.2, 状態異常スキル, 35, "麻痺"),
        new スキル("しのせんこく", 120, 42, (使用者, 対象者) => {
          // デフォルトに忠実: テンションを下げない TODO
        }),
        new スキル("あんさつけん", 150, 24, (使用者) => {
          属性.攻
        }),
      ], 転職条件.アイテム("闇のﾛｻﾞﾘｵ"));
    }
  }

  class 医術師 extends 転職可能な職業 {
    constructor() {
      super(4, 4, 1, 3, 3, [
        スキル.全体(状態異常回復スキル, "どくちりょう", 5, 2, 属性.無, "猛毒"),
        スキル.全体(状態異常回復スキル, "まひちりょう", 10, 3, 属性.無, "麻痺"),
        new スキル("めざめのうた", 20),
        スキル.単体(一時的状態スキル, "リジェネ", 40, 7, 属性.魔, "回復"),
        スキル.単体(状態異常回復スキル, "エスナ", 70, 10, 属性.無),
        スキル.単体(回復スキル, "ケアルガ", 110, 35, 属性.魔, 400),
        スキル.単体(蘇生スキル, "アレイズ", 150, 70, 属性.魔, 1, 1)
      ], new 転職条件(["僧侶", "羊飼い", "白魔道士", "光魔道士"]));
    }
  }

  class ﾁｮｺﾎﾞ extends 転職可能な職業 {
    constructor() {
      super(6, 1, 3, 2, 5, [
        スキル.単体攻撃("チョコボキック", 20, 4, 属性.攻, ステータス.攻撃力, 1.4),
        スキル.自身(バフスキル, "チョコガード", 40, 5, 属性.無, 0.5, ステータス.守備力),
        スキル.反動つき単体攻撃("チョコアタック", 60, 8, 属性.攻, ステータス.守備力, 2, 7),
        スキル.単体非依存攻撃("チョコボール", 80, 14, 属性.魔, 170),
        スキル.単体(回復スキル, "チョコケアル", 100, 7, 属性.魔, 150),
        スキル.単体攻撃("チョコボックル", 120, 15, 属性.魔, ステータス.素早さ, 1.5)
      ], 転職条件.アイテム("ｷﾞｻﾞｰﾙの野菜"));
    }
  }

  class ﾓｰｸﾞﾘ extends 転職可能な職業 {
    constructor() {
      super(3, 4, 2, 4, 4, [
        new スキル("おまじない", 10, 5, (使用者, 対象者) => { new 命中率回復スキル(使用者, 対象者, 属性.無); }), // TODO
        スキル.単体(状態異常スキル, "ストップ", 30, 8, 属性.魔, 85, "動封"),
        new スキル("ウールガード", 50),
        スキル.ＭＰ吸収("マホトラおどり", 70, 3, 属性.踊, 0.18),
        new スキル("カエルのうた", 90, 30, (使用者, 対象者) => {
          const 技 = new デバフスキル(使用者, 対象者, 属性.歌, ステータス.攻撃力, 0.4);
          if (!技.完了) {
            return;
          }
          new デバフスキル(使用者, 技.対象者, 属性.歌, ステータス.守備力, 0.4);
          技.対象者.アイコン = "chr/022.gif";
          使用者.チャット書き込み予約(`${技.対象者.名前}はカエルの姿になった！`);
        }),
        new スキル("リジェネ", 40),
        スキル.単体非依存攻撃("アルテマチャージ", 150, 40, 属性.攻, 300)
      ], 転職条件.アイテム("ｸﾎﾟの実"));
    }
  }

  class ｷﾞｬﾝﾌﾞﾗｰ extends 転職可能な職業 {
    constructor() {
      super(3, 5, 3, 1, 5, [
        new スキル("ヘブンスロット", 10, 7, (使用者) => {
          const
            記号の数 = カジノのスロットの記号リスト.length,
            結果 = [整数乱数(記号の数), 整数乱数(記号の数), 整数乱数(記号の数)],
            最初の記号 = カジノのスロットの記号リスト[結果[0]].記号;
          使用者.チャット書き込み予約(`【${最初の記号}】【${カジノのスロットの記号リスト[結果[1]].記号}】【${カジノのスロットの記号リスト[結果[2]].記号}】`);
          if (結果[0] == 結果[1] && 結果[1] == 結果[2]) {
            if (最初の記号 === "７") {
              new 全体技(使用者, 即死スキル, 1, 属性.無, 90);
              return;
            }
            const 威力 = (結果[0] + 2) * 100;
            new 全体技(使用者, (最初の記号 === "∞" || 最初の記号 === "†") ? 回復スキル : 単体ダメージ, 1, 属性.無, 威力);
            return;
          }
          const 威力 = Math.trunc((結果[0] + 結果[1] + 結果[2]) * 7);
          new 全体技(使用者, 単体ダメージ, 1, 属性.無, 威力, true);
        }),
        スキル.単体(即死スキル, "いちげきのダーツ", 30, 14, 属性.攻, 20),
        new スキル("あくまのダイス", 60, 6, (使用者, 対象者) => {
          const
            結果 = [整数乱数(6, 1, true), 整数乱数(6, 1, true), 整数乱数(6, 1, true)],
            威力 = Math.trunc((結果[0] * 100 + 結果[1] * 10 + 結果[0]) * 0.5);
          使用者.チャット書き込み予約(`[${結果[0]}][${結果[1]}][${結果[2]}]`);
          new 単体ダメージ(使用者, 対象者, 属性.魔, 威力, true);
          使用者.反動ダメージ((6 - 結果[0]) * 10 + (6 - 結果[1]) + (6 - 結果[2]) * 0.1);
        }),
        new スキル("しのルーレット", 80), // TODO 表記ゆれ
        new スキル("イカサマのダイス", 140, 36, (使用者, 対象者) => {
          const
            結果 = [整数乱数(3, 1, true), 整数乱数(6, 1, true), 整数乱数(6, 1, true)],
            威力 = 結果[0] * 100 + 結果[1] * 10 + 結果[0];
          使用者.チャット書き込み予約(`[${結果[0]}][${結果[1]}][${結果[2]}]`);
          new 単体ダメージ(使用者, 対象者, 属性.魔, 威力, true);
        })
      ], 遊び人だとアイテム消費免除だがアイテムを装備していないと候補に出ない転職条件.アイテムと実績("ｷﾞｬﾝﾌﾞﾙﾊｰﾄ", "カジノ熟練度", 10));
    }
  }

  class ｿﾙｼﾞｬｰ extends 転職可能な職業 {
    constructor() {
      super(6, 1, 6, 4, 4, [
        スキル.単体攻撃("ブレイバー", 20, 5, 属性.攻, ステータス.攻撃力, 1.2),
        スキル.反動つき単体攻撃("きょうぎり", 50, 9, 属性.攻, ステータス.攻, 1.6, 6),
        new スキル("メテオレイン", 80, 20, (使用者, _対象者) => {
          const { 対象者 } = new 単体ダメージ(使用者, _対象者, 属性.攻, 使用者.ステータス.攻撃力.現在値 * 1.8);
          使用者.ステータスを下げる(ステータス.攻撃力, 0.1); // TODO 下限なし
        }),
        new スキル("クライムハザード", 120, 36, (使用者) => {
          new クライムハザード(使用者, 対象者, 属性.攻, 400);
        }),
        スキル.連続攻撃(4, 4, "ちょうきゅうぶしんはざん", 160, 40, 属性.攻, ステータス.攻撃力, 1)
      ], 転職条件.性別とアイテム("男", "ｼﾞｪﾉﾊﾞ細胞"));
    }
  }

  class 堕天使 extends 転職可能な職業 {
    constructor() {
      super(3, 5, 4, 2, 3, [
        new スキル("バイオガ", 40, 56, (使用者) => {
          全体技.ダメージ(使用者, 属性.魔, 120);
          new 全体技(使用者, 状態異常スキル, 1, 属性.魔, 40, "猛毒");
        }),
        new スキル("やみのてんし", 80, 66, (使用者) => {
          new 全体技(使用者, 単体ダメージ, 1, 属性.魔, 70);
          new 全体技(使用者, 状態異常スキル, 1, 属性.魔, 30, "眠り");
        }),
        new スキル("シャドウフレア", 120, 66, (使用者) => {
          属性.魔
        }), // TODO
        new スキル("こころないてんし", 160, 44, (使用者, 対象者) => {

        }), // TODO
        スキル.全体攻撃("はっとういっせん", 200, 46, 属性.攻, ステータス.攻撃力, 1.2)
      ], 転職条件.性別とアイテム("女", "ｼﾞｪﾉﾊﾞ細胞"));
    }
  }

  class たまねぎ剣士 extends 転職可能な職業 {
    constructor() {
      super(0, 0, 0, 0, 0, [
        スキル.単体(状態異常回復スキル, "リボン", 100, 10, 属性.無),
        new スキル("オニオンシールド", 200, 20, (使用者) => {
          new バフスキル(使用者, 使用者, 属性.攻.ステータス.守備力, 0.6); // TODO tryいるかも
          使用者.一時的状態にする("攻軽減", (使用者) => クラス付きテキスト("tmp", `${使用者.名前}は守りを固めた！`));
        }),
        スキル.単体攻撃("オニオンソード", 300, 30, 属性.攻, ステータス.攻撃力, 1.6)
      ]);
    }

    に転職できる(メンバー) {
      return メンバー.現職名または前職名(this.名前) || メンバー.現職.SP > 300;
    }

    成長結果取得(メンバー) {
      const SP = メンバー.現職.SP;
      return 成長率.成長結果取得(new ステータス(
        SP * 0.02,
        SP * 0.02,
        SP * 0.02,
        SP * 0.02,
        SP * 0.02
      ));;
    }
  }

  class ｱｲﾃﾑ士 extends 転職可能な職業 {
    constructor() {
      super(3, 4, 2, 3, 4, [
        スキル.単体(回復スキル, "ポーション", 10, 5, 属性.魔, 80),
        new スキル("キュアブラインド", 25, 3, (使用者, 対象者) => {
          new 命中率回復スキル(使用者, 対象者, 属性.魔);
        }), // TODO テキスト
        new スキル("ドラゴンアーマー", 55, 10, (使用者, 対象者) => {
          const 技 = new バフスキル(使用者, 対象者, 属性.魔, ステータス.守備力, 0.4);
          技.対象者.一時的状態にする("息軽減");
        }),
        スキル.単体(回復スキル, "ハイポーション", 75, 24, 属性.魔, 200),
        スキル.単体(ＭＰ回復スキル, "エーテル", 110, 50, 属性.魔, 50),
        new スキル("ラストエリクサー", 145, 1, (使用者, 対象者) => {
          使用者.チャット書き込み予約(クラス付きテキスト("die", `${使用者}は自分の命をささげました！`));
          対象者.必要なら生き返ってからＨＰ全回復(); // TODO テキスト
          対象者.ステータス.ＭＰ.基礎値へ();
          使用者.死亡(true, false);
          使用者.ＭＰ減少(Infinity, null);
        })
      ], new 転職条件(["商人", "風水士", "医術士"]));
    }
  }

  class 光魔道士 extends 転職可能な職業 {
    constructor() {
      super(3, 5, 2, 3, 4, [
        スキル.全体(命中率低下スキル, "まぶしいひかり", 10, 6, 属性.魔, 0.2),
        new スキル("ひかりのみちびき", 30, 11, (使用者) => {
          for (const 味方 of 使用者.メンバー全員(false)) {
            味方.命中率を初期値に(null);
          }
          使用者.チャット書き込み予約(クラス付きテキスト("st_up", `${使用者.名前}たちの命中率が回復した`));
        }),
        スキル.全体(回復スキル, "いやしのひかり", 50, 14, 属性.魔, new 範囲(50, 99)), // TODO 範囲
        スキル.全体ランダム状態異常("あやしいひかり", 80, 16, 属性.魔, 50, ["混乱", "眠り"]),
        スキル.全体非依存攻撃("ひかりのさばき", 110, 34, 属性.魔, 170),
        スキル.全体蘇生("きぼうのひかり", 130, 30, 属性.無, 1, 1 / 5),
        new スキル("ぜつぼうのひかり", 160, 46, (使用者) => {
          new 全体技(使用者, 即死スキル, 1, 属性.魔, 10);
          全体技.ダメージ(使用者, 属性.魔, 70);
        })
      ], new 転職条件(["白魔道士", "聖騎士", "天使", "闇魔道士", "賢者"]));
    }
  }

  // ここから重複確認済み
  class 魔人 extends 転職可能な職業 {
    constructor() {
      super(5, 2, 5, 2, 3, [
        new スキル("ひざげり", 20),
        new スキル("ちからをためる", 50),
        new スキル("アーマーブレイク", 80),
        new スキル("きあいため", 130, 20, (使用者) => {
          使用者.一時的状態にする("２倍");
          使用者.テンションを上げる();
          使用者.テンションを上げる();
        }),
        new スキル("だいぼうそう", 150, 30, (使用者) => {
          全体技.ダメージ(使用者, 属性.攻, 200);
          使用者.一時的状態にする("２倍");
        })
      ], 転職条件.職業と実績(["戦士", "ﾊﾞｰｻｰｶｰ", "ﾓﾝｸ"], "モンスター討伐数", 1001));
    }
  }

  class 蟲師 extends 転職可能な職業 {
    constructor() {
      super(4, 3, 3, 4, 5, [
        スキル.単体(状態異常スキル, "くものいと", 5, 3, 属性.息, 80, "動封"),
        スキル.単体(状態異常スキル, "どくのいと", 15, 4, 属性.息, 80, "猛毒"),
        スキル.全体ランダム状態異常("むしのいき", 30, 16, 属性.息, 60, ["猛毒", "麻痺", "眠り"]),
        スキル.単体(一時的状態スキル, "あくまのわな", 55, 15, 属性.息, "攻反撃", "は特殊な糸で守られた！"),
        スキル.単体(状態異常スキル, "くものす", 80, 8, 属性.息, 80, "攻封"),
        new スキル("あやつりいと", 120, 7, (使用者, 対象者) => {
          new 通常攻撃(対象者);
        })
      ], new 転職条件(["遊び人", "魔物使い", "忍者"]));
    }
  }

  class 魔銃士 extends 転職可能な職業 {
    constructor() {
      super(3, 4, 5, 1, 4, [
        スキル.単体(状態異常スキル, "いかくしゃげき", 5, 4, 属性.攻, 80, "動封"),
        スキル.単体攻撃("そげき", 15, 7, 属性.攻, ステータス.攻撃力, 0.6, true),
        new スキル("たかのめ", 30, 0, (使用者) => {
          使用者.命中率を初期値に();
        }),
        new スキル("かんせつねらい", 60, 12, (使用者, 対象者) => {
          const 技 = new 単体ダメージ(使用者, 対象者, 属性.攻, 使用者.ステータス.攻撃力 * 0.5, true);
          if (!技.完了 || 技.対象者.は死んでいる()) {
            return;
          }
          new 状態異常スキル(使用者, 対象者, 属性.攻, 80, "動封");
        }),
        スキル.全体非依存攻撃("クレイモア", 90, 34, 属性.攻, 180),
        スキル.連続攻撃(3, 4, "みだれうち", 130, 44, 属性.攻, ステータス.攻撃力, 0.7, true)
      ], 転職条件.アイテム("魔銃"));
    }
  }

  class 妖精 extends 転職可能な職業 {
    constructor() {
      super(3, 5, 2, 3, 5, [
        new スキル("めかくし", 5, 0, (使用者) => {
          const 対象者 = 使用者.ランダムなメンバーを取得();
          対象者.命中率 = Math.trunc(対象.命中率 * 0.5);
          使用者.チャット書き込み予約(`${使用者.名前}は${対象者.名前}に目隠しをし`);
          使用者.チャット書き込み予約(クラス付きテキスト("st_down", `${対象者.名前}の命中率がさがった！`));
        }),
        new スキル("ようせいのや", 10),
        スキル.いたずら("くちをふさぐ", 20, "魔封"), // TODO
        new スキル("ちょうはつ", 35),
        new スキル("でたらめや", 50),
        new スキル("からかう", 65),
        スキル.ゆびをふる("ゆびをふる", 80)
      ], 転職条件.アイテム("妖精の笛"));
    }
  }

  class ﾐﾆﾃﾞｰﾓﾝ extends 転職可能な職業 {
    constructor() {
      super(3, 5, 2, 4, 4, [
        スキル.全体非依存攻撃("イオ", 6, 5, 属性.魔, 25),
        new スキル("マホキテ", 16),
        new スキル("イオラ", 36),
        new スキル("パルプンテ", 46, 10, (使用者) => {
          if (確率(1 / 2)) {
            const 一時的状態名 = ランダムな1要素(["２倍", "攻反撃", "魔反撃", "受流し"]);
            for (const メンバー of 使用者.メンバー全員(undefined, false)) {
              メンバー.一時的状態にする(一時的状態名);
            }
            使用者.チャット書き込み予約(`なんと、${クラス付きテキスト("tmp", `全員の状態が ${一時的状態名} になりました！`)}`);
          }
          else if (確率(1 / 2)) {
            const 状態異常名 = ランダムな1要素(["混乱", "眠り", "麻痺", "猛毒"]);
            for (const メンバー of 使用者.メンバー全員(undefined, false)) {
              メンバー.状態異常にする(状態異常名, true, false);
            }
            使用者.チャット書き込み予約(`なんと、${クラス付きテキスト("state", `全員が ${状態異常名} 状態になりました！`)}`);
          }
          else if (確率(1 / 2)) {
            for (const メンバー of 使用者.メンバー全員()) {
              if (メンバー.ステータス.ＨＰ.基礎値 > 999) {
                continue;
              }
              if (メンバー.は死んでいる()) {
                使用者.チャット書き込み予約(クラス付きテキスト("revive", `${メンバー.名前}が生き返った`));
              }
              メンバー.ステータス.ＨＰ.基礎値へ();
            }
            使用者.チャット書き込み予約(クラス付きテキスト("heal", "全員のＨＰが回復した！"));
          }
          else if (確率(1 / 3)) {
            for (const メンバー of 使用者.メンバー全員()) {
              メンバー.ステータス.素早さ = 0;
            }
            使用者.チャット書き込み予約(`なんと、${クラス付きテキスト("st_down", "全員の体がなまりのように重くなった！")}`);
          }
          else if (確率(1 / 2)) {
            for (const メンバー of 使用者.メンバー全員(undefined, false)) {
              if (!メンバー.は即死耐性を持っている(false)) {
                メンバー.ステータス.ＨＰ.現在値 = 1;
              }
            }
            使用者.チャット書き込み予約(`なんと、空から流星が降りそそいだ！全員の${クラス付きテキスト("damage", "ＨＰが 1 ")}になった！`);
          }
          else {
            使用者.チャット書き込み予約("………。しかし、何も起こらなかった…");
          }
        }),
        new スキル("イオナズン", 66),
        スキル.ゆびをふる("デビルテイル", 96)
      ], 転職条件.アイテム("悪魔のしっぽ"));
    }
  }

  class ｴﾙﾌ extends 転職可能な職業 {
    constructor() {
      super(4, 4, 3, 4, 4, [
        new スキル("ホイミ", 10),
        new スキル("フラッシュアロー", 20),
        new スキル("ベホイミ", 40),
        new スキル("ラリホーアロー", 60),
        new スキル("ザオラル", 80),
        new スキル("ようせいのや", 100),
        スキル.全体(バフスキル, "バイシオン", 120, 33, 属性.魔, ステータス.攻撃力, 0.7)
      ], 転職条件.アイテム("ｴﾙﾌの飲み薬"));
    }
  }

  class ﾀﾞｰｸｴﾙﾌ extends 転職可能な職業 {
    constructor() {
      super(3, 6, 3, 2, 4, [
        new スキル("ライフシェーバー", 20, 26, (使用者, 対象者) => {
          if (!対象者.回避(1 / 5)) {
            new デバフスキル(使用者, 対象者, 属性.魔, ステータス.ＨＰ, 0.7)
          }
        }),
        new スキル("トランス", 50, 9, (使用者) => {
          使用者.状態異常を解除(undefined, null);
          new バフスキル(使用者, 使用者, 属性.攻, ステータス.攻撃力, 1);
          new バフスキル(使用者, 使用者, 属性.攻, ステータス.素早さ, 1);
          使用者.一時的状態にする("魔吸収", null);
          使用者.状態異常にする("混乱", (戦闘メンバー) => `${戦闘メンバー.名前}はトランス状態になった！`);
        }),
        スキル.全体ランダム状態異常("のろい", 80, 16, 属性.魔, 70, ["魔封", "攻封", "動封"]),
        スキル.単体(デバフスキル, 属性.魔, ステータス.ＭＰ, 0.4),
        new スキル("かくせい", 140, 33, (使用者) => {
          使用者.一時的状態にする("２倍");
          使用者.テンションを上げる();
          使用者.テンションを上げる();
        }),
        new スキル("ハレーション", 160, 66, (使用者) => {
          for (const 敵 of 使用者.メンバー全員(true)) {
            if (!敵.回避(1 / 3)) {
              new デバフスキル(使用者, 敵, 属性.魔, ステータス.ＨＰ, 0.75);
            }
          }
        })
      ], 転職条件.アイテム("禁じられた果実"));
    }
  }

  class 連携系職業 extends 転職可能な職業 {
    constructor(
      ＨＰ成長率, ＭＰ成長率, 攻撃力成長率, 守備力成長率, 素早さ成長率,
      呼び出す名前, 呼び出す味方リスト, 呼び出すはレベル依存かまたはランダムか, 連携できる職業名, 連携技, 転職条件
    ) {
      super(ＨＰ成長率, ＭＰ成長率, 攻撃力成長率, 守備力成長率, 素早さ成長率, [], 転職条件);
      this.スキルリスト = [
        new スキル("よびだす", 10, 30, this.#よびだす.bind(this), false),
        new スキル("にげろ", 11, 0, this.#にげろ.bind(this), false),
        new スキル("こうげきめいれい", 12, 0, this.#こうげきめいれい.bind(this), false),
        new スキル("ひっさつめいれい", 30, 30, this._ひっさつめいれい.bind(this), false),
        new スキル("ぼうぎょめいれい", 100, 10, this.#ぼうぎょめいれい.bind(this), false),
        連携技 ?? this.#がったい.bind(this)
      ];
      this.#呼び出す名前 = `@${呼び出す名前}@`;
      this.#呼び出す味方リスト = 呼び出す味方リスト;
      this.#よびだすがレベル依存かランダムか = false;
      this.#連携できる職業名 = 連携できる職業名;
    }

    #よびだす(使用者) {
      this.使用者.#呼び出す名前;
      if (使用者.現在地.名前から(this.#呼び出す名前)) {
        使用者.チャット書き込み予約(`${this.#呼び出す名前}を呼び出すのに失敗した…`);
        return;
      }
      使用者.チャット書き込み予約(`${this.#呼び出す名前}が戦闘に参加した！`);
      const 添え字 = !呼び出すはレベル依存かまたはランダムか ? (
        確率(1 / 3) ? 0
          : 確率(1 / 3) ? 1
            : 2
      ) : 使用者.レベル < 40 ? 0
        : 使用者.レベル < 70 ? 1
          : 2;
      使用者.現在地.メンバー追加(this.#呼び出す味方リスト[添え字].戦闘メンバーとして取得(this.#呼び出す名前, 使用者, !呼び出すはレベル依存かまたはランダムか));
    }

    #にげろ(使用者) {
      const パートナー = 使用者.現在地.名前から(this.#呼び出す名前);
      if (パートナー === undefined || パートナー.は死んでいる()) {
        return;
      }
      パートナー.色 = NPC色;
      パートナー.死亡();
      使用者.チャット書き込み予約(`${this.#呼び出す名前}が戦闘から逃げ出した！`);
    }

    #こうげきめいれい(使用者, 対象者) {
      const パートナー = this.#連携できるメンバーを探す(使用者);
      使用者.チャット書き込み予約(`${パートナー.名前}： ＠こうげき `);
      new こうげき(パートナー, 対象者); // TODO
    }

    #ぼうぎょめいれい(使用者) {
      const パートナー = this.#連携できるメンバーを探す(使用者);
      使用者.チャット書き込み予約(`${パートナー.名前}： ＠ぼうぎょ `);
      パートナー.一時的状態にする("防御", "は身を固めた！");
    }

    #ひっさつめいれい(使用者, 対象者) {
      const パートナー = this.#連携できるメンバーを探す(使用者);
      使用者.チャット書き込み予約(`${パートナー.名前}： `);
      this._ひっさつめいれい(使用者, 対象者, パートナー);
    }

    #連携技(使用者) {
      const パートナー = this.#連携できるメンバーを探す(使用者);
      this._連携技中身?.() ?? this.#がったい(使用者, パートナー);
    }

    #連携できる職業の味方を探す(使用者) {
      // 合体済みを除くためアイコンで判定
      const
        職業 = 職業.一覧(this.#連携できる職業名),
        男アイコン = 職業.アイコン名を取得("男"),
        女アイコン = 職業.アイコン名を取得("女");

      for (const 味方 of 使用者.メンバー全員(false, undefined, true)) {
        if (味方.アイコン === 男アイコン || 味方.アイコン === 女アイコン) {
          if (味方.は死んでいる())
            throw "連携する味方が死んでいる";
          return 味方;
        }
      }
    }

    #連携できるメンバーを探す(使用者) {
      const パートナー = 使用者.現在地.名前から(this.#呼び出す名前) ?? this.#連携できる職業の味方を探す(使用者);
      if (パートナー === undefined)
        throw "連携できる味方がいなかった";
      return パートナー;
    }

    #がったい(使用者, パートナー) {
      // TODO
      使用者.ステータス.増減(パートナー.ステータス);
      パートナー.ステータス = 使用者.ステータス;
      クラス付きテキスト("tmp", `${使用者.名前}と${パートナー.名前}は合体した！`);
      使用者.アイコン = this.アイコン名を取得(使用者.性別, true);
      if (パートナー.はNPC()) {
        パートナー.色 = NPC色;
        パートナー.ステータス.ＨＰ.現在値 = 0;
      }
      else {
        パートナー.アイコン = "job/0.gif";
      }
    }

    #連携できる職業名;
    #呼び出す名前;
    #呼び出す味方リスト;
    #よびだすがレベル依存かランダムか;
  }

  class ｽﾗｲﾑﾗｲﾀﾞｰ extends 連携系職業 {
    constructor() {
      super(4, 3, 2, 1, 4, "ｽﾗｲﾑ", [
        new NPCの味方("mon/001.gif", 70, 120, 50, 30, 120),
        new NPCの味方("mon/006.gif", 180, 80, 80, 50, 200),
        new NPCの味方("mon/004.gif", 5, 10, 10, 950, 950)
      ], true, "ｽﾗｲﾑ", undefined, 転職条件.アイテム("ｽﾗｲﾑﾋﾟｱｽ"));
    }

    _ひっさつめいれい(使用者, 対象者, パートナー) {
      if (確率(1 / 2)) {
        $com = '＠スラアタック ';
        new 単体ダメージ(使用者, 対象者, 属性.攻, パートナー.ステータス.攻撃力.現在値 * 1.5, '攻');
      }
      else if (確率(1 / 2)) {
        $com = '＠スラストライク ';
        new 単体ダメージ(使用者, 対象者, 属性.攻, パートナー.ステータス.攻撃力.現在値 * 1.2, true);
      }
      else {
        $com = '＠しゃくねつ ';
        全体技.ダメージ(220, '息', 1);
      };
    }
  }

  class ﾄﾞﾗｺﾞﾝﾗｲﾀﾞｰ extends 連携系職業 {
    constructor() {
      super(5, 2, 4, 4, 2, "ﾄﾞﾗｺﾞﾝ", [
        new NPCの味方("083.gif", 160, 70, 180, 100, 70),
        new NPCの味方("mon/084.gif", 250, 50, 300, 200, 100),
        new NPCの味方("mon/224.gif", 400, 30, 400, 300, 100)
      ], true, "ﾄﾞﾗｺﾞﾝ", undefined, 転職条件.アイテム("飛竜のﾋｹﾞ"));
    }

    _ひっさつめいれい(使用者, 対象者, パートナー) {
      if (確率(1 / 2)) {
        $com = '＠きりさく ';
        new 単体ダメージ(使用者, 対象者, 属性.攻, パートナー.ステータス.攻撃力.現在値 * 1.7);
      }
      else if (確率(1 / 2)) {
        $com = '＠たたきつぶす ';
        new 単体ダメージ(使用者, 対象者, 属性.攻, パートナー.ステータス.攻撃力.現在値 * 1.5, true);
      }
      else {
        $com = '＠かがやくいき ';
        全体技.ダメージ(使用者, 属性.息, 230);
      }
    }
  }

  class ﾈｸﾛﾏﾝｻｰ extends 連携系職業 {
    constructor() {
      super(3, 5, 2, 1, 4, "ｿﾞﾝﾋﾞ", [
        new NPCの味方("mon/040.gif", 120, 120, 120, 60, 120),
        new NPCの味方("mon/041.gif", 300, 200, 280, 90, 240),
        new NPCの味方("mon/064.gif", 444, 444, 666, 222, 444)
      ], true, "ﾈｸﾛﾏﾝｻｰ", true, 転職条件.アイテム("禁断の書"));
    }

    _ひっさつめいれい(使用者) {
      if (確率(1 / 2)) {
        $com = '＠ザラキ ';
        new 全体技(使用者, 即死スキル, 1, 属性.魔, 22);
      }
      else if (確率(1 / 2)) {
        $com = '＠バイオガ ';
        全体技.ダメージ(使用者, 属性.魔, 120);
        new 全体技(使用者, 状態異常スキル, 1, 属性.魔, 40, "猛毒");
      } else {
        $com = '＠もうどくのきり ';
        new 全体技(使用者, 状態異常スキル, 1, 属性.息, 70, "猛毒");
      }
    }
  }

  class ﾊﾞｯﾄﾏｽﾀｰ extends 連携系職業 {
    constructor() {
      super(4, 4, 3, 1, 5, "ﾊﾞｯﾄ", [
        new NPCの味方("mon/025.gif", 90, 80, 120, 10, 180),
        new NPCの味方("mon/026.gif", 210, 270, 170, 30, 400),
        new NPCの味方("mon/027.gif", 410, 350, 400, 50, 600)
      ], true, "ﾐﾆﾃﾞｰﾓﾝ", true, 転職条件.アイテム("ｺｳﾓﾘの羽"));
    }

    _ひっさつめいれい(使用者, 対象者) {
      if (確率(1 / 2)) {
        $com = '＠きゅうけつ ';
        new 連続技(使用者, 対象者,
          [単体ダメージ, 属性.魔, 100, true],
          [回復スキル, 属性.魔]
        );
      }
      else if (確率(1 / 2)) {
        $com = '＠アスピル ';
        new 連続技(使用者, 対象者,
          [デバフスキル, 属性.魔, 0.3, ステータス.ＭＰ],
          [ＭＰ回復スキル, 属性.魔]
        );
      }
      else {
        $com = '＠ちょうおんぱ ';
        new 全体技(状態異常スキル, 使用者, 属性.歌, 70, "混乱");
      }
    }
  }

  class ｷﾉｺﾏｽﾀｰ extends 連携系職業 {
    constructor() {
      super(4, 3, 3, 3, 3, "ｷﾉｺ", [
        new NPCの味方("mon/030.gif", 100, 100, 80, 50, 80),
        new NPCの味方("mon/031.gif", 300, 80, 150, 100, 100),
        new NPCの味方("mon/032.gif", 400, 600, 200, 100, 100)
      ], true, "ｷﾉｺﾏｽﾀｰ", undefined, 転職条件.アイテム("ﾏｼﾞｯｸﾏｯｼｭﾙｰﾑ"));
    }

    _ひっさつめいれい(使用者) {
      if (確率(1 / 2)) {
        $com = '＠どくのこな ';
        new 全体技(使用者, 状態異常スキル, 1, 属性.息, 90, "猛毒");
      }
      else if (確率(1 / 2)) {
        $com = '＠しびれごな ';
        new 全体技(使用者, 状態異常スキル, 1, 属性.息, 50, "麻痺");
      } else {
        $com = '＠ねむりごな ';
        new 全体技(使用者, 状態異常スキル, 1, 属性.息, 50, "眠り");
      };
    }
  }

  class ｵﾊﾞｹﾏｽﾀｰ extends 連携系職業 {
    constructor() {
      super(3, 4, 2, 3, 5, "ｺﾞｰｽﾄ", [
        new NPCの味方("mon/035.gif", 100, 100, 50, 100, 100),
        new NPCの味方("mon/036.gif", 200, 80, 100, 150, 150),
        new NPCの味方("mon/070.gif", 300, 60, 150, 200, 200)
      ], true, "ｵﾊﾞｹﾏｽﾀｰ", undefined, 転職条件.アイテム("透明ﾏﾝﾄ"));
    }

    _ひっさつめいれい(使用者, 対象者) {
      if (確率(1 / 2)) {
        $com = '＠ひょうい ';
        // TODO
        // my($y) = & _check_enemy(shift, '操り', '息'); return if !$y;
        // $com= "$n： ＠こうげき ";
        // $buf_m = $m;
        // $m = $y;
        // & kougeki();
        // $m = $buf_m;
      }
      else if (確率(1 / 2)) {
        $com = '＠じゅばく ';
        new 状態異常スキル(使用者, 対象者, 属性.無, 80, "攻封");
      }
      else {
        $com = '＠おどろかす';
        new 全体技(使用者, 状態異常スキル, 1, 属性.攻, 60, "動封");
      }
    }
  }

  class ｹﾓﾉﾏｽﾀｰ extends 連携系職業 {
    constructor() {
      super(5, 2, 4, 3, 4, "ｹﾓﾉ", [
        new NPCの味方("mon/200.gif", 100, 60, 100, 60, 180),
        new NPCの味方("mon/206.gif", 210, 90, 300, 80, 280),
        new NPCの味方("mon/203.gif", 400, 230, 500, 160, 400)
      ], true, "ﾓｰｸﾞﾘ", true, 転職条件.アイテム("獣の血"));
    }

    _ひっさつめいれい(使用者, 対象者, パートナー) {
      if (確率(1 / 2)) {
        $com = '＠ひっかく ';
        new 単体ダメージ(使用者, 対象者, 属性.攻, パートナー.ステータス.攻撃力.現在値 * 1.5);
      }
      else if (確率(1 / 2)) {
        $com = '＠かみつく ';
        new 単体ダメージ(使用者, 対象者, 属性.攻, パートナー.ステータス.攻撃力.現在値 * 1.2, true);
      }
      else {
        $com = '＠とつげき ';
        new 単体ダメージ(使用者, 対象者, 属性.攻, パートナー.ステータス.攻撃力.現在値 * 2.0);
      }
    }
  }

  class ﾄﾞｸﾛﾏｽﾀｰ extends 連携系職業 {
    constructor() {
      super(4, 3, 3, 4, 3, "ｶﾞｲｺﾂ", [
        new NPCの味方("mon/043.gif", 120, 110, 160, 90, 150),
        new NPCの味方("mon/044.gif", 240, 210, 240, 120, 180),
        new NPCの味方("mon/056.gif", 450, 280, 400, 240, 300)
      ], true, "ﾄﾞｸﾛﾏｽﾀｰ", true, 転職条件.アイテム("死者の骨"));
    }

    _ひっさつめいれい(使用者, 対象者) {
      if (確率(1 / 2)) {
        $com = '＠しのおどり ';
        new 全体技(使用者, 即死スキル, 1, 属性.踊, 20);
      }
      else if (確率(1 / 2)) {
        $com = '＠デス ';
        new 即死スキル(使用者, 対象者, 属性.攻, 40);
      }
      else {
        $com = '＠のろい ';
        const 状態異常候補 = ["攻封", "動封"];
        for (const 敵 of 使用者.メンバー全員(true)) {
          new 状態異常スキル(使用者, 敵, 属性.魔, 75, ランダムな1要素(状態異常候補));
        }
      }
    }
  }

  class ﾊﾞﾌﾞﾙﾏｽﾀｰ extends 連携系職業 {
    constructor() {
      super(4, 4, 2, 2, 3, "ﾊﾞﾌﾞﾙ", [
        new NPCの味方("mon/020.gif", 90, 120, 90, 50, 90),
        new NPCの味方("mon/021.gif", 180, 280, 160, 120, 180),
        new NPCの味方("mon/022.gif", 8, 500, 80, 950, 950)
      ], true, "ﾊｸﾞﾚﾒﾀﾙ", true, 転職条件.アイテム("謎の液体"));
    }

    _ひっさつめいれい(使用者, 対象者, パートナー) {
      if (パートナー.アイコン名.includes("020")) {
        $com = '＠ドクドク ';
        new 全体技(使用者, 状態異常スキル, 属性.息, 80, "猛毒");
      }
      else if (パートナー.アイコン名.includes("021")) {
        $com = '＠マグマ ';
        全体技.ダメージ(使用者, 属性.息, 220);
      }
      else {
        $com = '＠ジゴスパーク ';
        全体技.ダメージ(使用者, 属性.魔, 150);
        new 全体技(使用者, 状態異常スキル, 属性.魔, 20, "麻痺");
      }
    }
  }

  class ｺﾛﾋｰﾛｰ extends 連携系職業 {
    constructor() {
      super(5, 2, 4, 3, 3, "ｺﾛ", [
        new NPCの味方("mon,101.gif", 0.8, 0.2, 3.0, 2.0, 1.0),
        new NPCの味方("mon/102.gif", 0.6, 1.0, 1.0, 1.0, 2.0),
        new NPCの味方("mon/103.gif", 0.7, 1.0, 1.5, 1.5, 1.5)
      ], false, "ｺﾛﾋｰﾛｰ", true, 転職条件.アイテム("ﾋｰﾛｰｿｰﾄﾞ"));
    }

    _ひっさつめいれい(使用者, 対象者, パートナー) {
      if (パートナー.アイコン名.includes("101")) {
        $com = '＠まじんぎり ';
        new 単体ダメージ(使用者, 対象者, 属性.攻, 確率(1 / 2) ? 20 : 使用者.ステータス.攻撃力.現在値 * 3);
      }
      else if (パートナー.アイコン名.includes("102")) {
        $com = '＠メラゾーマ ';
        new 単体ダメージ(使用者, 対象者, 属性.魔, 220, true);
      }
      else {
        $com = '＠ベホマ ';
        new 回復スキル(使用者, 対象者, 属性.魔, 999);
      }
    }
  }

  class ﾌﾟﾁﾋｰﾛｰ extends 連携系職業 {
    constructor() {
      super(5, 2, 4, 3, 3, "ﾌﾟﾁ", [
        new NPCの味方("mon/106.gif", 0.8, 0.2, 3.0, 2.0, 1.0),
        new NPCの味方("mon/107.gif", 0.6, 1.0, 1.0, 1.0, 2.0),
        new NPCの味方("mon/108.gif", 0.7, 1.0, 1.5, 1.5, 1.5)
      ], false, "ﾌﾟﾁﾋｰﾛｰ", new スキル("ミナデイン", 180, 30, (使用者, 対象者) => {
        new ミナデイン(使用者, 対象者, 属性.魔, 100, 15, 85);
      }), 転職条件.アイテム("ﾋｰﾛｰｿｰﾄﾞ2"));
    }

    _ひっさつめいれい(使用者, 対象者, パートナー) {
      if (パートナー.アイコン名.includes("106")) {
        $com = '＠まじんぎり ';
        new 単体ダメージ(使用者, 対象者, 属性.攻, 確率(1 / 2) ? 20 : 使用者.ステータス.攻撃力.現在値 * 3);
      }
      else if (パートナー.アイコン名.includes("107")) {
        $com = '＠メラゾーマ ';
        new 単体ダメージ(使用者, 対象者, 属性.魔, 220, true);
      }
      else {
        $com = '＠ベホマ ';
        new 回復スキル(使用者, 対象者, 属性.魔, 999);
      }
    }
  }

  class 天竜人 extends 転職可能な職業 {
    constructor() {
      super(4, 5, 3, 2, 3, [
        new スキル("めいそう", 50),
        new スキル("ドラゴンパワー", 100),
        new スキル("ギガデイン", 150),
        new スキル("てんしのうたごえ", 200)
      ], new 転職条件(空配列));
    }
  }

  class ﾁｮｺﾎﾞﾗｲﾀﾞｰ extends 連携系職業 {
    constructor() {
      super(5, 3, 2, 3, 2, "ﾁｮｺﾎﾞ", [
        new NPCの味方("job/44_m.gif", 150, 70, 100, 50, 180),
        new NPCの味方("chr/032.gif", 270, 50, 270, 70, 270),
        new NPCの味方("chr/033.gif", 500, 30, 300, 300, 10)
      ], false, "ﾁｮｺﾎﾞ", undefined, 転職条件.アイテム("ﾁｮｺﾎﾞの羽"));
    }

    _ひっさつめいれい(使用者, 対象者, パートナー) {
      if (確率(1 / 3)) {
        $com = "＠チョコボキック ";
        new 単体ダメージ(使用者, 対象者, 属性.攻, パートナー.ステータス.攻撃力.現在値 * 1.4);
      }
      else if (確率(1 / 2)) {
        $com = '＠チョコケアル ';
        new 回復スキル(使用者, 対象者, 属性.魔, 150);
      }
      else {
        $com = '＠チョコダンス ';
        new 全体技(使用者, 状態異常スキル, 1, 属性.踊, 80, "動封");
      }
    }
  }

  class 算術士 extends 転職可能な職業 {
    constructor() {
      super(3, 6, 1, 3, 3, [
        // TODO
      ], 転職条件.アイテム("ｲﾝﾃﾘﾒｶﾞﾈ"));
    }
  }

  class すっぴん extends 転職可能な職業 {
    constructor() {
      super(5, 5, 4, 4, 4, [
        // TODO
      ], 転職条件.実績("ジョブマスター", 1))
    }
  }

  class 無職 extends 職業 {
    constructor() {
      super([
        new スキル("こうげき", 8, 0, (使用者, 対象者) => { new 通常攻撃(使用者, 対象者); }),
        new スキル("こうげき", 9),
        new スキル("こうげき", 10),
        new スキル("てんしょん", 20, (使用者) => { 使用者.テンションを上げる(); }),
        new スキル("ぼうぎょ", 30, 0, (使用者) => { 使用者.一時的状態にする("防御") })
      ]);
    }
  }

  class 猛毒系 extends 職業 {
    constructor() {
      super([
        new スキル("どくこうげき", 10),
        new スキル("ポイズン", 20),
        new スキル("もうどくのきり", 30)
      ]);
    }
  }

  class 麻痺系 extends 職業 {
    constructor() {
      super([
        new スキル("まひこうげき", 10),
        new スキル("しびれうち", 20),
        new スキル("やけつくいき", 30, 9)
      ]);
    }
  }

  class 眠り系 extends 職業 {
    constructor() {
      super([
        new スキル("ラリホー", 10),
        スキル.追加効果付き単体攻撃("ねむりこうげき", 20, 15, 属性.攻, ステータス.攻撃力, 0.8, 状態異常スキル, 属性.攻, 55, "眠り"),
        new スキル("あまいいき", 30)
      ])
    }
  }

  class 即死系 extends 職業 {
    constructor() {
      super([
        new スキル("ザキ", 10),
        new スキル("ザラキ", 20),
        new スキル("しのおどり", 30),
        new スキル("しのせんこく", 40)
      ]);
    }
  }

  class 自爆系 extends 職業 {
    constructor() {
      super([
        new スキル("メガンテ"), // TODO
        new スキル("ねる", 20)
      ]);
    }
  }

  class 召喚系 extends 職業 {
    constructor() {
      super([
        new スキル("しょうかん", 0, 50), // TODO
        new スキル("しょうかん", 0)
      ]);
    }
  }

  class ﾄﾞｰﾙﾏｽﾀｰ extends 職業 {
    constructor() {
      super([
        new スキル("あやつる", 0, 0), // TODO
        new スキル("クールジョーク", 0)
      ]);
    }
  }

  // TODO スキル効果埋め & スキル効果一致確認
  class 超攻撃系 extends 職業 {
    constructor() {
      super([
        new スキル("みだれうち", 0), // TODO 弓使いと同じ
        new スキル("ばくれつけん", 0), // TODO 威力違い
        new スキル("いてつくはどう", 0),
        new スキル("めいやく", 0),
        new スキル("だいぼうそう", 0), // TODO 威力違い
        new スキル("あんこくけん", 0, 40), // TODO 反動違い
        new スキル("きあいため", 0, 33), // TODO 消費ＭＰ違い
        スキル.全体非依存攻撃("しっこくのほのお", 0, 80, 属性.息, 400),
        new スキル("ジゴスパーク", 0), // TODO 威力違い
        new スキル("しのせんこく", 0), // TODO 確率違い
        new スキル("やみのてんし", 0) // TODO 威力違い
      ]);
    }
  }

  class 超魔法系 extends 職業 {
    constructor() {
      super([
        new スキル("こころないてんし", 0), // TODO 確率違い
        new スキル("こころないてんし", 0),
        new スキル("いてつくはどう", 0),
        new スキル("カーバンクル", 0),
        new スキル("マイティガード", 0), // TODO ＭＰ違い
        new スキル("かくせい", 0), // TODO ＭＰ違い
        new スキル("ブラッドレイン", 0, 40), // TODO いろいろ違い
        new スキル("バブルボム", 0, 40), // TODO 違い
        new スキル("しっこくのほのお", 0), // TODO 威力違い
        new スキル("ダークメテオ", 0, 99,), // TODO
        スキル.全体非依存攻撃("アルテマ", 0, 99, 属性.魔, 400)
      ]);
    }
  }

  class にげだす extends 職業 {
    constructor() {
      super([
        new スキル("にげだす", 0, 0, (使用者) => { 使用者.死亡(false); })
      ]);
    }
  }

  class ﾄﾝﾍﾞﾘ extends 職業 {
    constructor() {
      super([
        new スキル("みんなのうらみ", 0, 99, (使用者, 対象者) => {
          new 単体ダメージ(使用者, 対象者, 属性.攻, あなた.実績.モンスター討伐数 * 0.1, true);
        }), // TODO
        スキル.単体非依存攻撃("ほうちょう", 0, 666, 属性.攻, 666, true)
      ]);
    }
  }

  class 暗黒竜のﾀﾏｺﾞ extends 職業 {
    constructor() {
      super([
        new スキル("しょうかん", 0), // TODO 効果違い
        new スキル("しょうかん", 0)
      ]);
    }
  }

  class NPCの味方 {
    constructor(アイコン, ＨＰ, ＭＰ, 攻撃力, 守備力, 素早さ) {
      this.#アイコン = アイコン;
      this.#ステータス = new 簡易ステータス(ＨＰ, ＭＰ, 攻撃力, 守備力, 素早さ);
    }

    戦闘メンバーとして取得(名前, 召喚者, 召喚者のステータス依存 = false) {
      return new 戦闘メンバー({
        名前,
        色: 召喚者.色,
        アイコン: this.#アイコン,
        ＨＰ: this.#ステータス.ＨＰ * 召喚者のステータス依存 ? 召喚者.ステータス.ＨＰ.基礎値 : 1,
        ＭＰ: this.#ステータス.ＭＰ * 召喚者のステータス依存 ? 召喚者.ステータス.ＭＰ.基礎値 : 1,
        攻撃力: this.#ステータス.攻撃力 * 召喚者のステータス依存 ? 召喚者.ステータス.攻撃力.基礎値 : 1,
        守備力: this.#ステータス.守備力 * 召喚者のステータス依存 ? 召喚者.ステータス.守備力.基礎値 : 1,
        素早さ: this.#ステータス.素早さ * 召喚者のステータス依存 ? 召喚者.ステータス.素早さ.基礎値 : 1
      });
    }

    #アイコン;
    #ステータス;
  }

  class スキル extends こうどう {
    constructor(名前, SP, ＭＰ, 効果, キャッシュする = true) {
      // TODO 同名スキルのキャッシュ
      super(名前, 効果, (戦闘メンバー) => 戦闘メンバー.ステータス.ＭＰ.現在値 >= this.#ＭＰ);
      if (効果 === undefined && !スキル.#キャッシュ.has(名前))
        throw new Error(`スキル「${名前}」が定義前に参照されました`);
      if (効果 !== undefined && キャッシュする) {
        if (!スキル.#キャッシュ.has(名前)) {
          スキル.#キャッシュ.set(名前, this);
        }
        else if (スキル.#同名異効果スキル名リスト.has(名前)) {
          if ($$$___名前が重複定義されているスキルをコンソールに表示する___$$$) {
            console.log(`スキル「${名前}」は既に定義されています`);
          }
        }
        else
          throw `スキル「${名前}」は既に定義されています。同名異効果スキル名リストに登録するか、修正してください。`;
      }
      this.#SP = SP;
      this.#ＭＰ = ＭＰ;
    }

    実行(使用者, 対象) {
      const
        キャッシュスキル = this.#ＭＰ ? this : スキル.#キャッシュ.get(this.名前),
        ＭＰ = this.#ＭＰ ?? キャッシュスキル.#ＭＰ,
        効果 = this._効果 ?? キャッシュスキル._効果;
      try {
        try {
          使用者.状態異常?.ターン開始時チェック?.(使用者);
          if (使用者.一時的状態?.解除チェック()) {
            使用者.一時的状態 = undefined;
          }
          効果(使用者, 対象);
        } catch (技中断の理由) { }
        if (使用者.は死んでいる())
          throw "死亡";
        使用者.状態異常?.技発動後チェック?.(使用者);
        if (使用者.は死んでいる())
          throw "死亡";
        使用者.一時的状態?.ターン終了時チェック?.(使用者);
      }
      catch (中断理由) { }
      使用者.ステータスを下げる("ＭＰ", ＭＰ, true);
    }

    は使用可能(SP, ＭＰ) {
      return this.#SP >= SP && this.#ＭＰ >= ＭＰ;
    }

    _状態取得関数(メンバーの職業) {
      return メンバーの職業.SP >= this.SP ? こうどう.状態.有効 : こうどう.状態.無効;
    }

    static 単体攻撃(名前, SP, ＭＰ, _属性, 依存ステータス, 倍率, 守備力を貫通する) {
      return new スキル(名前, SP, ＭＰ, (使用者, 対象者) => { new 単体ダメージ(使用者, 対象者, _属性, 使用者.ステータス[依存ステータス] * 倍率, 守備力を貫通する); });
    }

    static 単体非依存攻撃(名前, SP, ＭＰ, 属性, ダメージ量, 守備力を貫通する = true) {
      return new スキル(名前, SP, ＭＰ, (使用者, 対象者) => { new 単体ダメージ(使用者, 対象者, _属性, ダメージ量, 守備力を貫通する); });
    }

    static 反動つき単体攻撃(名前, SP, ＭＰ, _属性, 依存ステータス, 倍率, 反動パーセント) {
      return new スキル(名前, SP, ＭＰ, (使用者, 対象者) => {
        new 連続技(使用者, 対象者, true,
          [単体ダメージ, _属性, 使用者.ステータス[依存ステータス] * 倍率],
          [反動ダメージ, 反動パーセント]
        );
      });
    }

    static 追加効果付き単体攻撃(名前, SP, ＭＰ, _属性, 依存ステータス, 倍率, 追加効果, ...引数) {
      return new スキル(名前, SP, ＭＰ, (使用者, 対象者) => {
        new 連続技(使用者, 対象者, true,
          [単体ダメージ, _属性, 使用者.ステータス[依存ステータス] * 倍率],
          [追加効果, _属性, ...引数]
        );
      });
    }

    static 全体攻撃(名前, SP, ＭＰ, _属性, 依存ステータス, 倍率, 守備力を貫通する) {
      return new スキル(名前, SP, ＭＰ, (使用者) => { 全体技.ダメージ(使用者, _属性, 使用者.ステータス[依存ステータス] * 倍率, 守備力を貫通する); });
    }

    static 全体非依存攻撃(名前, SP, ＭＰ, 属性, ダメージ量, 追加効果, ...属性以外の引数) {
      return new スキル(名前, SP, ＭＰ, 属性, (使用者) => {
        全体技.ダメージ(使用者, 属性, ダメージ量);
        if (追加効果) {
          new 全体技(追加効果, 1, 使用者, 属性, ...属性以外の引数); // TODO 守備力貫通
        }
      });
    }

    static 連続攻撃(最小攻撃回数, 最大攻撃回数, 名前, SP, ＭＰ, 属性, 依存ステータス, 倍率, ...引数) { // TODO
      const 回数範囲 = new 範囲(最小攻撃回数, 最大攻撃回数);
      return new スキル(名前, SP, ＭＰ, (使用者) => {
        const 回数 = 回数範囲.ランダム取得();
        for (let i = 0; (i < 回数) && !使用者.は死んでいる(); i += 1) {
          new 単体ダメージ(使用者, undefined, 属性, 使用者.ステータス[依存ステータス] * 倍率, ...引数);
        }
      });
    }

    static 非依存連続攻撃(最小攻撃回数, 最大攻撃回数, 名前, SP, ＭＰ, 属性, 威力) {
      const 回数範囲 = new 範囲(最小攻撃回数, 最大攻撃回数);
      return new スキル(名前, SP, ＭＰ, (使用者) => {
        const 回数 = 回数範囲.ランダム取得();
        for (let i = 0; (i < 回数) && !使用者.は死んでいる(); i += 1) {
          new 単体ダメージ(使用者, undefined, 属性, 威力, true);
        }
      });
    }

    static 自身(効果, 名前, SP, ＭＰ, 属性, ...引数) {
      return new スキル(名前, SP, ＭＰ, (使用者) => { new 効果(使用者, 使用者, 属性, ...引数); });
    }

    static 単体(効果, 名前, SP, ＭＰ, 属性, ...引数) {
      return new スキル(名前, SP, ＭＰ, (使用者, 対象者) => { new 効果(使用者, 対象者, 属性, ...引数); });
    }

    static 全体(効果, 名前, SP, ＭＰ, 属性, ...引数) {
      return new スキル(名前, SP, ＭＰ, (使用者) => { new 全体技(効果, 1, 使用者, 属性, ...引数); });
    }

    static 全体ランダム状態異常(名前, SP, ＭＰ, 属性, 確率, 状態異常候補) {
      return new スキル(名前, SP, ＭＰ, (使用者) => {
        for (const 敵 of 使用者.メンバー全員(true)) {
          new 状態異常スキル(使用者, 敵, 属性, 確率, ランダムな1要素(状態異常候補));
        }
      });
    }

    static 非依存ＨＰ吸収(名前, SP, ＭＰ, 属性, 最低, 最高) { // TODO
      return new スキル(名前, SP, ＭＰ, (使用者) => {
        new 連続技(使用者, 対象者, true,
          [単体ダメージ, 属性, 最低 + Math.random() * (最高 - 最低)],
          [回復スキル, 属性]
        );
      });
    }

    static ＭＰ吸収(名前, SP, ＭＰ, 属性, 係数) {
      return new スキル(名前, SP, ＭＰ, (使用者) => {
        new 連続技(使用者, 対象者, true,
          [デバフスキル, 属性, ステータス.ＭＰ, 係数],
          [ＭＰ回復スキル, 属性]
        );
      });
    }

    static いたずら(名前, SP, 状態異常名) {
      return new スキル(名前, SP, 0, (使用者) => { const 対象 = 使用者.ランダムなメンバーを取得(); 対象.状態異常にする(状態異常名, true); });
    }

    static ゆびをふる(名前, SP) {
      return new スキル(名前, SP, 0, 技.ゆびをふる);
    }

    // 混乱無効
    static 全体一時的状態(名前, SP, ＭＰ, 属性, 一時的状態名) {
      return new スキル(名前, SP, ＭＰ, (使用者) => {
        this.発動者.状態異常?.技発動時チェック?.({ 属性 });
        for (const 味方 of 使用者.メンバー全員(false, true)) {
          味方.一時的状態にする(一時的状態名);
        }
      });
    }

    // 混乱無効
    static 全体蘇生(名前, SP, ＭＰ, 属性, 係数, _確率) {
      return new スキル(名前, SP, ＭＰ, (使用者) => {
        this.発動者.状態異常?.技発動時チェック?.({ 属性 });
        for (const 味方 of 使用者.メンバー全員(false, true)) {
          if (確率(_確率)) {
            味方.ステータス.ＨＰ.基礎値へ(係数);
            // TODO 生き返りました
          }
        }
      });
    }

    // 状態異常無効
    static 自身命中率リセット(名前, SP, ＭＰ) {
      return new スキル(名前, SP, ＭＰ, (使用者) => { 使用者.命中率を初期値に(); });
    }

    static 自身一時的状態(名前, SP, ＭＰ, 一時的状態, 表示文) {
      return new スキル(名前, SP, ＭＰ, (使用者) => { 使用者.一時的状態にする(一時的状態, 表示文); });
    }

    #SP;
    #ＭＰ;

    static #キャッシュ = new Map();

    static #同名異効果スキル名リスト = new Set([
      "ねる", "ねむりのうた", "みかわしきゃく", "まひこうげき", "グランドクロス", "すてみ", "せいしんとういつ",
      "みねうち", "めいやく", "しのルーレット", "やけつくいき", "ミナデイン", "みだれうち",
      "うけながし", "ポイズン", "しびれうち", "しのせんこく", "ばくれつけん", "だいぼうそう",
      "あんこくけん", "きあいため", "ジゴスパーク", "やみのてんし", "こころないてんし",
      "マイティガード", "かくせい", "ブラッドレイン", "バブルボム", "しっこくのほのお"
    ]);
  }

  // TODO $is_add_effect
  class 技 {
    constructor(使用戦闘メンバー, ...引数) {
      this.#使用者 = 使用戦闘メンバー;
      this.#完了 = false;
      this._効果(...引数);
      this.#完了 = true;
    }

    get 使用者() { return this.#使用者; }
    get 完了() { return this.#完了; }

    static 全体リセット(使用者) {
      for (const メンバー of 使用者.メンバー全員()) {
        メンバー.リセット(false);
      }
      使用者.チャット書き込み予約(クラス付きテキスト("st_down", "全ての効果がかき消された！"));
    }

    static メガザル(使用者) {
      使用者.チャット書き込み予約(クラス付きテキスト("die", `${使用者}は自分の命をささげました！`));
      for (const 味方 of 使用者.メンバー全員(false, undefined, true)) {
        味方.必要なら生き返ってからＨＰ全回復();
      }
      使用者.死亡(true, false);
      使用者.ＭＰ減少(Infinity, null);
    }

    static ライブラ(使用者, 対象者 = 使用者.ランダムなメンバーを取得()) {
      const 断片 = document.createDocumentFragment();
      断片.append(
        document.createElement("br"),
        対象者.名前,
        対象者.ステータス.一行出力()
      );
      使用者.チャット書き込み予約(断片);
    }

    static ゆびをふる(使用者, 対象者) {
      const 職業 = 転職可能な職業.ランダム取得();
      // if (@r_skills <= 0) {
      //   $com .= "しかし、何も起こらなかった…";
      //   return;
      // }
      const ＭＰ = this.使用者.ＭＰ.現在値;
      _職業.ランダムスキル(使用者, 対象者);
      this.使用者.ＭＰ.現在値 = ＭＰ;
    }

    _命中前チェック(技情報, 敵かまたは味方, 死んでいるメンバーも対象にする = false) {
      Object.assign(this, 技情報);
      this.発動者.状態異常?.技発動時チェック?.(this);
      if (this.対象者 === undefined) { // 多分TODO 名前色が妥当か判定
        this.対象者 = 敵かまたは味方 ? this.発動者.ランダムな敵を取得() : this.発動者.ランダムな味方を取得();
        if (!死んでいるメンバーも対象にする && this.対象者.は死んでいる())
          throw "対象者が死んでいる";
      }
      this.対象者?.一時的状態?.技命中時チェック?.(this);
    }

    _効果() { return true; }

    #使用者;
    #完了;
  }

  class 敵単体技 extends 技 {
    _命中前チェック(技情報, 死んでいるメンバーも対象にする) {
      super._命中前チェック(技情報, true, 死んでいるメンバーも対象にする);
    }
  }

  class 単体ダメージ extends 敵単体技 {
    _効果(対象戦闘メンバー, _属性, 威力, 守備力を貫通する = (_属性 !== 属性.攻)) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性: _属性, 威力, 守備力を貫通する: 守備力を貫通する });
      this.対象者.ダメージ(this.威力 * this.使用者.テンションを消費(), this.守備力を貫通する);
    }
  }

  class 通常攻撃 extends 敵単体技 {
    _効果(対象戦闘メンバー) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー });
      if (this.使用者.素早さ対抗判定(this.対象者)) {
        this.使用者.チャット書き込み予約(クラス付きテキスト("kaishin", "会心の一撃！"));
        new 単体ダメージ(this.使用者, this.対象者, 属性.攻, ステータス.攻撃力, 0.75, true);
      }
      else {
        new 単体ダメージ(this.使用者, this.対象者, 属性.攻, ステータス.攻撃力, 1);
      }
    }
  }

  class クライムハザード extends 敵単体技 {
    _効果(対象戦闘メンバー, 属性, 上限威力) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性 });
      const ＨＰ = this.対象者.ＨＰ;
      let 威力 = ＨＰ.基礎値 - ＨＰ.現在値 + 10;
      if (威力 > 400) {
        威力 = 400;
      }
      new 単体ダメージ(使用者, 対象者, this.属性, 威力, true);
    }
  }

  class ミナデイン extends 敵単体技 {
    _効果(対象戦闘メンバー, 属性, 基本威力, 味方の消費ＭＰ, 増加威力) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性 });
      let 威力 = 基本威力;
      for (const 味方 of this.使用者.メンバー全員(false, undefined, true)) {
        if (味方.ステータス.ＭＰ.現在値 >= 味方の消費ＭＰ) {
          味方.ステータス.ＭＰ.現在値 -= 味方の消費ＭＰ;
          威力 += 増加威力;
        }
      }
      new 単体ダメージ(使用者, 対象者, this.属性, 威力, true);
    }
  }

  class 命中率低下スキル extends 敵単体技 {
    _効果(対象戦闘メンバー, 属性, 係数) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, 威力: 係数, ステータス名: "命中率" });
      this.対象者.命中率を下げる(this.威力 * this.使用者.テンションを消費());
    }
  }

  class 封印 extends 敵単体技 {
    _効果(対象戦闘メンバー, 属性, _ステータス) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, ステータス: _ステータス });
      this.対象者.テンションを消費();
      this.対象者.一時的状態を解除();
      const ステータス = this.対象者.ステータス[this.ステータス];
      ステータス.現在値 = ステータス.基礎値;
      this.使用者.チャット書き込み予約(`${this.対象者}の${封印.#ステータスと装備種別の対応.get(this.ステータス) ?? "装備"}の強さを封じた！`);
      new デバフスキル(this.対象者, this.属性, 0.1, this.ステータス);
    }

    static #ステータスと装備種別の対応 = new Map([
      [ステータス.攻撃力, "武器"],
      [ステータス.守備力, "防具"]
    ]);
  }

  class 封印2 extends 敵単体技 {
    _効果(対象戦闘メンバー, 属性) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性 });
      this.対象者.テンションを消費();
      this.対象者.一時的状態を解除();
      const
        攻撃力 = this.対象者.ステータス.攻撃力,
        守備力 = this.対象者.ステータス.守備力;
      攻撃力.現在値 = 攻撃力.基礎値;
      守備力.現在値 = 守備力.基礎値;
      this.使用者.チャット書き込み予約(`${this.対象者}の武器と防具の強さを封印した！`);
    }
  }

  class デバフスキル extends 敵単体技 {
    _効果(対象戦闘メンバー, 属性, 係数, ステータス名) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, 威力: 係数, ステータス名 });
      this.対象者.ステータスを下げる(this.威力 * this.使用者.テンションを消費(), this.ステータス名);
    }
  }

  class 状態異常スキル extends 敵単体技 {
    _効果(対象戦闘メンバー, 状態異常名, 属性, 確率パーセント = 100) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 状態異常名, 属性, 確率: 確率パーセント });
      if (確率(this.確率 / 100)) {
        this.対象者.状態異常にする(this.状態異常名);
      }
    }
  }

  class 即死スキル extends 敵単体技 {
    _効果(対象戦闘メンバー, 属性, 確率) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, 確率 });
      if (確率(this.確率)) {
        this.対象者.死亡();
      }
    }
  }

  class からかう extends 敵単体技 {
    _効果() {
      super._命中前チェック({});
      this.対象者.テンションを上げる();
    }
  }

  class 味方単体技 extends 技 {
    _命中前チェック(技情報, 死んでいるメンバーも対象にする) {
      super._命中前チェック(技情報, false, 死んでいるメンバーも対象にする);
    }
  }

  class 回復スキル extends 味方単体技 {
    _効果(対象戦闘メンバー, 属性, 威力) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, 威力 });
      this.対象者.ＨＰ回復(this.威力);
    }
  }

  class 蘇生スキル extends 味方単体技 {
    _効果(対象戦闘メンバー, 属性, 係数, 成功確率 = 1) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, 威力: 係数, 確率: 成功確率 }, true);
      if (確率(this.確率)) {
        // TODO
        this.対象者.ＨＰ回復(this.対象者.ステータス.ＨＰ * this.威力, true);
      }
      else {
        this.使用者.チャット書き込み予約(`しかし、${this.対象者}は生き返らなかった…`);
      }
    }
  }

  class ＭＰ回復スキル extends 味方単体技 {
    _効果(対象戦闘メンバー, 属性, 威力) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, 威力 });
      this.対象者.ＭＰ回復(this.威力);
    }
  }

  class バフスキル extends 味方単体技 {
    _効果(対象戦闘メンバー, 属性, 係数, ステータス名) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, 威力: 係数, ステータス名 });
      this.対象者.ステータスを上げる(this.威力, this.ステータス名);
    }
  }

  class 一時的状態スキル extends 味方単体技 {
    _効果(対象戦闘メンバー, 属性, 一時的状態名, 表示テキスト) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, 一時的状態名 });
      this.対象者.一時的状態にする(this.一時的状態名, 表示テキスト);
    }
  }

  class 状態異常回復スキル extends 味方単体技 {
    _効果(対象戦闘メンバー, 属性, 状態異常名) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性, 状態異常名 });
      this.対象者.状態異常を解除(this.状態異常名);
    }
  }

  class 命中率回復スキル extends 味方単体技 {
    _(対象戦闘メンバー, 属性) {
      super._命中前チェック({ 対象者: 対象戦闘メンバー, 属性 });
      this.対象者.命中率を初期値に((名前) => クラス付きテキスト("st_up", `${名前}の命中率が回復した`));
    }
  }

  class 全体技 extends 技 {
    static ダメージ(使用者, 属性, 威力) { new 全体技(使用者, 単体ダメージ, 0.85, 属性, 威力); }

    _効果(単体技, 減衰係数, 属性, 威力, ...引数) {
      this.使用者.状態異常.技発動時チェック({ 属性, 威力 });
      for (const 戦闘メンバー of this.使用者.メンバー全員(単体技 instanceof 敵単体技, false)) {
        try {
          new 単体技(戦闘メンバー, ...引数);
        } catch (技中断の理由) { }
        if (Number.isFinite(威力)) {
          威力 *= 減衰係数;
        }
      }
    }
  }

  class 連続技 extends 技 {
    _効果(対象戦闘メンバー, 失敗以降発動しない, ...単体技と引数のリスト) {
      let _技 = { 対象者: 対象戦闘メンバー };
      for (const [技, ...引数] of 技と引数のリスト) {
        try {
          _技 = new 技(this.発動者, (技 instanceof 敵単体技) ? _技.対象者 : this.発動者, ...引数);
        } catch (技中断の理由) { console.log("これいる？"); } // TODO
        if (失敗以降発動しない && !_技.完了) {
          return;
        }
      }
    }
  }

  class 属性 {
    constructor(正式名, 短縮名, 使用可能の文章, 反撃時の文章) {
      this.#正式名 = 正式名;
      this.#短縮名 = 短縮名;
      this.#使用可能の文章 = 使用可能の文章;
      this.#反撃時の文章 = 反撃時の文章;
      属性.#一覧.add(this);
    }

    toString() { return this.#正式名; }

    get 短縮名() { return this.#短縮名; }
    get 使用可能の文章() { return this.#使用可能の文章; }
    get 反撃時の文章() { return this.#反撃時の文章; }

    static get 道具() { return undefined; }
    static get 無() { return undefined; }
    static get 攻() { return 属性.#物理; }
    static get 魔() { return 属性.#魔法; }
    static get 踊() { return 属性.#踊り; }
    static get 息() { return 属性.#息; }

    #正式名;
    #短縮名;
    #使用可能の文章;
    #反撃時の文章;

    * 全て() {
      for (const _属性 of 属性.#一覧) {
        yield _属性;
      }
    }

    static #一覧 = new Set();
    static #物理 = new 属性("物理攻撃", "攻", "物理攻撃ができる");
    static #魔法 = new 属性("魔法", "魔", "魔法が使える");
    static #踊り = new 属性("踊り", "踊", "踊れる", "踊り返した");
    static #息 = new 属性("ブレス", "息");
  }

  class テンション {
    constructor(名前, 倍率, パーセント, 表示正式名) {
      this.#名前 = 名前;
      this.#倍率 = 倍率;
      this.#パーセント = パーセント;
      this.#表示正式名 = 表示正式名;
      this.#ID = テンション.#自動ID++;
    }

    次を取得() {
      return テンション.#一覧[this.#ID + 1];
    }

    上昇時用出力(メンバー名) {
      const 断片 = document.createDocumentFragment();
      断片.append(`${メンバー名}のテンションが `, クラス付きテキスト("tenshon", `${this.#パーセント}％`), " になった！");
      if (this.#表示正式名 !== undefined) {
        断片.append(`${メンバー名}は`, クラス付きテキスト("tenshon", this.#表示正式名), "になった！")
      }
      return 断片;
    }

    メンバー用出力() {
      return クラス付きテキスト(`テンション${this.#パーセント}`, this.名前);
    }

    get 名前() { return this.#名前; }
    get 倍率() { return this.#倍率; }

    static パーセントから(パーセント) {
      return テンション.#パーセントから.get(パーセント);
    }

    static 初期化() {
      テンション.#一覧 = [
        new テンション("ﾃﾝｼｮﾝ", 1.7, 5),
        new テンション("ﾃﾝｼｮﾝ", 3, 20),
        new テンション("ﾊｲﾃﾝｼｮﾝ", 5, 50, "ハイテンション"),
        new テンション("Sﾊｲﾃﾝｼｮﾝ", 8, 100, "スーパーハイテンション")
      ];
      テンション.#パーセントから = new Map(this.#一覧.map((テンション) => [テンション.#パーセント, テンション]));
    }

    #名前;
    #ID;
    #倍率;
    #パーセント;
    #表示正式名;

    static #一覧;
    static #パーセントから;
    static #自動ID = 0;
  }

  class 状態異常 {
    constructor(名前) {
      this.#名前 = 名前;
    }

    get 名前() { return this.#名前; }

    ターン開始時チェック(戦闘メンバー) { return false; }
    技発動時チェック(技) { return false; }

    static 初期化() {
      this.#一覧 = new Map([
        new 猛毒(),
        new 動封("動封", 1,
          (メンバー名) => `しかし、${メンバー名}は動くことができない！`),
        new 動封("麻痺", 1 / 3,
          (メンバー名) => `${メンバー名}はしびれて動くことができない！`,
          (メンバー名) => `${メンバー名}${メンバー名}のしびれがなくなりました！`),
        new 動封("睡眠", 1 / 3,
          (メンバー名) => `${メンバー名}は眠っている！`,
          (メンバー名) => `${メンバー名}は眠りからさめました！`),
        [...属性.全て()].map((属性) => new 属性封印(属性))
      ]).map((状態異常) => [状態異常.名前, 状態異常]);
    }

    #名前;

    static #一覧;
  }

  class 猛毒 extends 状態異常 {
    constructor() {
      super("猛毒");
    }

    技発動後チェック(戦闘メンバー) {
      const 効果値 = 戦闘メンバー.ステータス.ＨＰ.現在値 > 9999 ? Math.random(100) + 950 : 戦闘メンバー.ステータス.ＨＰ.現在値 * 0.1;
      戦闘メンバー.チャット書き込み予約(`${戦闘メンバー.名前}は猛毒により <span class="damage">${効果値}</span> のダメージをうけた！`);
      // TODO 整数 復活しない
      戦闘メンバー.ＨＰダメージ(効果値, null, `<span class="die">${戦闘メンバー.名前}は倒れた！</span>`, true);
    }
  }

  class 混乱 extends 状態異常 {
    constructor() {
      super("混乱");
    }

    ターン開始時チェック(戦闘メンバー) {
      if (確率(1 / 5)) {
        戦闘メンバー.チャット書き込み予約(`${戦闘メンバー.名前}は混乱がなおりました！`);
        戦闘メンバー.状態異常を解除(undefined, null);
      }
      else {
        戦闘メンバー.チャット書き込み予約(`${戦闘メンバー.名前}は混乱している！`);
      }
    }

    技発動時チェック(技) {
      if (!技.混乱無効) {
        技.対象者 = 技.対象者.ランダムなメンバーを取得();
      }
    }
  }

  class 動封 extends 状態異常 {
    constructor(名前, 解除確率, 非解除時の文章取得関数, 解除時の文章取得関数) {
      super(名前);
      this.#解除確率 = 解除確率;
      this.#非解除時の文章取得関数 = 非解除時の文章取得関数;
      this.#解除時の文章取得関数 = 解除時の文章取得関数;
    }

    ターン開始時チェック(戦闘メンバー) {
      if (確率(this.#解除確率)) {
        戦闘メンバー.チャット書き込み予約(this.#解除時の文章取得関数);
        戦闘メンバー.状態異常を解除(undefined, null);
      }
      else {
        戦闘メンバー.チャット書き込み予約(this.#非解除時の文章取得関数);
      }
      throw this.名前;
    }

    #解除確率;
    #非解除時の文章取得関数;
    #解除時の文章取得関数;
  }

  class 属性封印 extends 状態異常 {
    constructor(属性, 解除時の文章取得関数) {
      super(`${属性.短縮名}封`);
      this.#属性 = 属性;
    }

    技発動時チェック(技) {
      if (技.属性 !== this.#属性) {
        return;
      }
      if (rand(4) < 1) {
        あなた.チャット書き込み予約(クラス付きテキスト("heal", `${技.使用者}は${技.属性.使用可能の文章}ようになりました！`));
        技.使用者.状態異常を解除();
        return;
      }
      あなた.チャット書き込み予約(`しかし、${技.使用者}は${技.属性}が封じられていた`);
      throw this.名前;
    }

    #属性;
  }

  class 一時的状態 {
    constructor(名前, 解除確率, 付与時の表示文章) {
      this._名前 = 名前;
      this.#解除確率 = 解除確率;
      this.#付与時の表示文章 = 付与時の表示文章;
    }

    付与時の文章を表示(戦闘メンバー) {
      return this.#付与時の表示文章 === undefined ? undefined
        : クラス付きテキスト("tmp", `${this.戦闘メンバー.名前}${this.#付与時の表示文章}`);
    }

    解除チェック() {
      return 確率(this.#解除確率);
    }

    static 初期化() {
      this.#一覧 = new Map([
        new 自動回復("は優しい光に包まれた！"),
        new 復活("は天使の加護がついた！"),
        new 防御("防御", 0.5, "は身を固めている"),
        new 防御("大防御", 0.1, "は守りのかまえをとった！"),
        new 防御("２倍", 2),
        new かばう(),
        new 一時的状態("かばい中", 1 / 3, "は仲間の前に立ちはだかった！"),
        new 受流し("は攻撃を受流すかまえをとった"),
        new 魔吸収("は不思議な光に包まれた！"),
        new 属性軽減(属性.攻, "はゴーレムに守られている！"),
        new 属性軽減(属性.魔, "は魔法の光で守られた！"),
        new 属性軽減(属性.息, "は不思議な風に包まれた！"),
        new 属性無効(属性.攻, "は守りのかまえをとった！"),
        new 属性無効(属性.魔, "は魔法をうけつけない体になった！"),
        new 属性反撃(属性.攻, "は反撃のかまえをとった！"),
        new 属性反撃(属性.魔, "は魔法の壁で守られた！"),
        new 属性反撃(属性.息, "の周りに追い風が吹いている！")
      ].map((一時的状態) => [一時的状態.名前, 一時的状態]));
    }

    _名前;
    #付与時の表示文章;
    #解除確率;

    static #一覧;
  }

  class 自動回復 extends 一時的状態 {
    constructor(付与時の表示文章) {
      super("回復", 1 / 3, 付与時の表示文章);
    }

    ターン終了時チェック(戦闘メンバー) {
      const
        最大ＨＰ = 戦闘メンバー.ステータス.ＨＰ.基礎値,
        効果値 = 最大ＨＰ > 999 ? Math.trunc(Math.random() * 100) : Math.trunc(最大ＨＰ * (0.1 + Math.random() * 0.1));
      戦闘メンバー.ＨＰ回復(効果値);
    }
  }

  class 復活 extends 一時的状態 {
    constructor(付与時の表示文章) {
      super("復活", 1 / 3, 付与時の表示文章);
    }

    死亡時チェック(技) {
      技.対象者.ステータス.ＨＰ.基礎値へ(0.1 + Math.random() * 0.1);
      技.対象者.リセット();
      技.使用者.チャット書き込み予約(`<span class="revive">${技.対象者}は瀕死でよみがえった！</span>`);
      return true;
    }
  }

  class 防御 extends 一時的状態 {
    constructor(名前, 係数, 付与時の表示文章) {
      super(名前, 付与時の表示文章);
      this.#係数 = 係数;
    }

    技命中時チェック(技) {
      技.威力 *= this.#係数;
    }

    #係数;
  }

  class かばう extends 一時的状態 {
    constructor() {
      super("かばう", 1 / 3);
    }

    付与時の文章を表示(対象者, 使用者) {
      return クラス付きテキスト("tmp", `${this.使用者.名前}は${this.対象者.名前}をかばっている`);
    }

    技命中時チェック(技) {
      for (const メンバー of 技.対象者.メンバー全員(false)) {
        if (メンバー.一時的状態.名前 === "かばい中" && メンバー.色 === 技.対象者.色) {
          技.使用者.チャット書き込み予約(`${メンバー.名前}が${技.対象者}をかばった！`);
          技.対象者 = メンバー;
          break;
        }
      }
    }
  }

  class 受流し extends 一時的状態 {
    constructor(付与時の表示文章) {
      // TODO デフォルトに忠実: 半角スペース入れるか入れないか
      super("受流し", 1 / 3, 付与時の表示文章);
    }

    技命中時チェック(技) {
      if (技.属性 !== 属性.攻) {
        return;
      }
      // TODO
      if (技.対象者.名前 === 技.使用者.名前) {
        技.使用者.チャット書き込み予約(`しかし、${技.使用者}は受流すのに失敗した！`);
      }
    }
  }

  class 魔吸収 extends 一時的状態 {
    constructor(付与時の表示文章) {
      super("魔吸収", 1 / 3, 付与時の表示文章);
    }

    技命中時チェック(技) {
      if (技.属性 !== 属性.魔) {
        return;
      }
      // TODO 威力が 文字 or undefined の時
      const ＭＰ回復量 = 技.威力 < 50 ? 整数乱数(49, 30, true) : 整数乱数(技.威力 * 0.5, 技.威力 * 0.2);
      技.使用者.ＭＰ回復(ＭＰ回復量, this.#表示文章を取得);
    }

    static #表示文章を取得(名前, 回復量) {
      return `${名前}はＭＰを <span class="heal">${ＭＰ回復量}</span> 吸収した！`;
    }
  }

  class 属性反撃 extends 一時的状態 {
    constructor(属性) {
      super(`${属性.短縮名}反撃`, 1);
      this.#属性 = 属性;
    }

    技命中時チェック(技) {
      if (技.属性 === this.#属性) {
        技.使用者.チャット書き込み予約(`${技.対象者}は<span class="tmp">${技.属性.反撃時の文章 ?? `${技.属性}をはね返した！`}</span>`); // TODO
        技.対象者 = 技.使用者;
      }
      return false;
    }

    #属性;
  }

  class 属性無効 extends 一時的状態 {
    constructor(属性, 文章表示関数) {
      super(`${属性.短縮名}無効`, 1 / 3, 文章表示関数);
      this.#属性 = 属性;
    }

    技命中時チェック(技) {
      if (技.属性 === this.#属性) {
        技.使用者.チャット書き込み予約(`${技.対象者}は<span class="tmp">${技.属性}をうけつけない！</span>`);
        return true;
      }
      return false;
    }

    #属性;
  }

  class 属性軽減 extends 一時的状態 {
    constructor(属性, 文章表示関数) {
      super(`${属性.短縮名}軽減`, 1 / 3, 文章表示関数);
      this.#属性 = 属性;
    }

    技命中時チェック(技) {
      if (技.属性 === this.#属性) {
        技.威力 *= 0.25;
      }
      return false;
    }

    #属性;
  }

  class ログインリスト {
    出力() {
      if (更新日時.取得() > あなた.最終ログイン日時 + ログインリストへの表示秒数) {
        あなた.最終ログイン日時 = Date.now();

        //      time<>$m{name}<>$m{color}<>$m{guild}<>$m{mes}<>$m{icon};
      }
    }
  }

  class プレイヤーの軌跡 {
    constructor(_ログインメンバー, レベル, _メンバーの職業, 内容, 日時) {
      this._ログインメンバー = new ログインメンバー(_ログインメンバー);
      this._レベル = レベル;
      this._メンバーの職業 = new メンバーの職業(_メンバーの職業);
      this._内容 = 内容;
      this._日時 = 日時;
    }

    出力() {
      return `${this._ログインメンバー.出力(true, false, true)}： ${this._レベル} ${this._メンバーの職業.toString()} ${内容} <span class="タイムスタンプ">(${this._日時})</span>`;
    }

    static オブジェクトから({ _ログインメンバー, _レベル, _メンバーの職業, _内容, _日時 }) {
      return new プレイヤーの軌跡({ _ログインメンバー, _レベル, _メンバーの職業, _内容, _日時 });
    }
  }

  class スクリーンショット {
    #トップページに書き込み() {
      localStorage.getItem
    }
  }

  class 更新日時 {
    static 取得() {
      return this.#更新日時;
    }

    static 更新() {
      const 現在ミリ秒 = Date.now();
      this.#更新日時 = Math.floor(現在ミリ秒 / 1000);
      this.#時間 = new Date(現在ミリ秒);
    }

    static 曜日に対応する要素を返す(...日曜日からの配列) {
      return 日曜日からの配列[this.#時間.getDay()] ?? ランダムな1要素(日曜日からの配列.filter(更新日時.#非null判定));
    }

    static タイムスタンプ文字列(日時) {
      return this.#タイムスタンプ生成機.format(日時 * 1000);
    }

    static 月日時タイムスタンプ文字列(日時) {
      return (this.#月日時タイムスタンプ生成機.format(日時 * 1000)).replace(" ", 空文字列);
    }

    static #更新日時;
    static #時間;
    static #タイムスタンプ生成機 = new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    static #月日時タイムスタンプ生成機 = new Intl.DateTimeFormat("ja-JP", {
      month: "long",
      day: "numeric",
      hour: "2-digit"
    });
    static #非null判定(対象) {
      return 対象 !== null;
    }
  }

  class 実績 {
    constructor(実績) {
      this._モンスター撃退数 = 実績?._モンスター撃退数 ?? 0;
      this._プレイヤー撃退数 = 実績?._プレイヤー撃退数 ?? 0;
      this._勇者熟練度 = 実績?._勇者熟練度 ?? 0;
      this._魔王熟練度 = 実績?._魔王熟練度 ?? 0;
      this._カジノ熟練度 = 実績?._カジノ熟練度 ?? 0;
    }

    プレイヤー一覧用出力() {
      return [this._モンスター撃退数, this._プレイヤー撃退数, this._勇者熟練度, this._魔王熟練度, this._カジノ熟練度];
    }

    簡易出力() {
      const 断片 = document.createDocumentFragment();
      断片.append(
        `モンスター撃退数 ${this._モンスター撃退数}回`, document.createElement("br"),
        `プレイヤー撃退数 ${this._プレイヤー撃退数}回`, document.createElement("br"),
        `封印解いた回数 ${this._勇者熟練度}回`, document.createElement("br"),
        `封印した回数 ${this._魔王熟練度}回`, document.createElement("br"),
        `カジノ勝利数 ${this._カジノ熟練度}回`
      );
      return 断片;
    }

    static ランキング作成開始() {
      実績.#ランキング = new Map(実績.#種別1
        .map(種別 => [種別, new 実績ランキング(ランキング表示人数)]));
    }

    static ランキング判定1(メンバー) {
      for (const 種別 of 実績.#種別1) {
        実績.#ランキング.get(種別).追加(this[実績.#種別対応プロパティ名.get(種別)], メンバー);
      }
    }

    static ランキング作成開始2() {
      for (const [種別, 除外種別] of 実績.#種別2) {
        実績.#ランキング.set(種別, new 実績ランキング(ランキング表示人数, 実績.#ランキング.get(除外種別)));
      }
    }

    static ランキング判定2(メンバー) {
      for (const 種別 of 実績.#種別2.keys()) {
        実績.#ランキング.get(種別).追加(this[実績.#種別対応プロパティ名.get(種別)], メンバー);
      }
    }

    static ランキング出力() {
      実績.#ランキング = null;
    }

    _プレイヤー撃退数;
    _モンスター撃退数;
    _カジノ熟練度;
    _勇者熟練度;
    _魔王熟練度;
    _錬金数;
    _手助け数;

    // コンプリート系
    _ジョブマスター;
    _モンスターマスター;
    _ウェポンキラー;
    _アーマーキング;
    _アイテムニスト;
    _アルケミスト;

    static #ランキング;
    static #種別1 = Object.freeze(["プレイヤー撃退数", "勇者熟練度", "錬金数", "手助け数"]);
    static #種別2 = Object.freeze(new Map([["モンスター撃退数", "プレイヤー撃退数"], ["魔王熟練度", "勇者熟練度"]]));
    static #種別対応プロパティ名 = Object.freeze(new Map([...実績.#種別1, ...実績.#種別2.keys()].map(種別 => [種別, "#" + 種別])));
  }

  class 実績ランキング {
    constructor(最大順位, 除外実績ランキング) {
      this.#最大順位 = 最大順位;
      this.#最小 = Infinity;
      this.#ランキング = [];
      this.#除外 = 除外実績ランキング ? 除外実績ランキング.#メンバー() : null;
      this.#探索回数 = 0;
      let 最大探索可能順位 = 1;
      while (最大探索可能順位 < 最大順位) {
        this.#探索回数 += 1;
        最大探索可能順位 <<= 1;
      }
    }

    追加(数値, メンバー) {
      if (this.#除外?.has(メンバー) ?? false)
        return;
      const 現在登録人数 = this.#ランキング.length;
      if (現在登録人数 < 最大順位) {
        this.#ランキング[this.#ランキング.length] = Object.freeze({ メンバー, 数値 });
        return;
      }
      if (現在登録人数 === 最大順位) {
        this.#ランキング.sort();
        this.#最小 = this.#ランキング[this.#ランキング.length - 1].数値;
        return;
      }
      if (this.#最小 > 数値)
        return;
      if (this.#最小 === 数値) {
        this.#ランキング[this.#ランキング.length] = Object.freeze({ メンバー, 数値 });
        return;
      }
      // TODO 二分探索などしてがんばる
      throw new Error("未実装");
      let 添え字 = 1 << (this.#探索回数 - 1) - 1;
      for (let i = this.#探索回数 - 2; i >= 0; i -= 1) {
        添え字 += (1 << i) * ((this.#ランキング[添え字] > 数値) ? 1 : -1);
      }
      添え字 += (this.#ランキング[添え字] > 数値) ? 1 : 0;
    }

    結果() {
      return this.#ランキング;
    }

    #メンバー() {
      return new Set(this.#ランキング.map(this.#メンバープロパティ取得));
    }

    #メンバープロパティ取得(ランキング) {
      return ランキング.メンバー;
    }

    #ランキング;
    #除外;
    #最大順位;
    #最小;
    #探索回数;
  }

  class 何でも屋クエスト {
    アイテム一覧取得() {

    }
  }

  class 倉庫 {

  }

  class アイテム倉庫 extends 倉庫 {
    最大() {
      return Math.max(最大アイテム預かり個数, あなた.転職回数 * 5 + 5);
    }
  }

  class モンスター倉庫 extends 倉庫 {
    最大() {
      return 最大モンスター預かり体数;
    }
  }

  class ギルド {
    削除() {
      ニュース.書き込み(`< span class="die" > ${this.#名前} ギルドが解散しました</ > `);
    }

    メンバー削除(メンバー) {
      if (this.#メンバー.Count() === 1) {
        this.削除();
        return;
      }
      this.#メンバー.delete(メンバー);
      if (メンバー === this.#ギルマス) {
        ギルマス交代();
      }
    }

    ギルマス交代(次期ギルマス = this.#次期ギルマス取得()) {
    }

    static 必要なら一覧出力() {
      // TODO  
    }

    #次期ギルマス取得() {
      const 配列メンバー = Array.from(this.#メンバー);
      return 配列メンバー.find(this.#名前にギルマスを含む, this)
        ?? 配列メンバー[0];
    }

    #名前にギルマスを含む(メンバー) {
      return this.#次期ギルマスか.test(メンバー.#名前);
    }

    toString() {
      return this.#名前;
    }

    #名前;
    #ギルマス;
    #メンバー;
    #色;
    #背景;
    #めっせーじ;
    #ポイント;
    static #次期ギルマスか = new RegExp(/ギルマス/);

    static 必要なら一覧更新() {

    }
  }

  // $mes 相当
  class 通知欄 {
    static 追加(内容, クリック時入力文字列) {
      あなた.チャット書き込み停止();
      const 入力文字列がある = !!クリック時入力文字列;
      let 内容要素;
      if (Array.isArray(内容)) {
        内容要素 = document.createElement("span");
        let 最初 = true;
        for (const _内容 of 内容) {
          if (最初) {
            最初 = false;
          }
          else {
            内容要素.appendChild(document.createElement("br"));
          }
          if (_内容) {
            const _内容要素 = 通知欄.#文字列ならノードに(_内容);
            内容要素.appendChild(_内容要素);
          }
        }
      }
      else {
        内容要素 = 通知欄.#文字列ならノードに(内容, 入力文字列がある);
      }
      チャットフォーム.文字列追加イベントを登録(内容要素, クリック時入力文字列);
      this.#要素.appendChild(内容要素);
    }

    static 削除 = (() => {
      this.#要素.textContent = 空文字列;
      チャットフォーム.文字列追加イベントを削除(this.#要素);
    }).bind(通知欄);

    static #文字列ならノードに(内容, 入力文字列がある) {
      return (typeof 内容 !== "string") ? 内容
        : (入力文字列がある) ? 通知欄.#span生成(内容)
          : document.createTextNode(内容);
    }

    static #span生成(内容) {
      const span = document.createElement("span");
      span.textContent = 内容;
      return span;
    }

    static #要素 = $id("通知欄");
  }

  class 画面 {
    constructor(対応id) {
      this.#要素 = $id(対応id);
    }

    表示(表示 = true) {
      scroll(0, 0);
      if (画面.#表示中) {
        画面.#表示中.#要素.hidden = !!表示;
      }
      this.#要素.hidden = !表示;
      画面.#表示中 = this;
    }

    #要素;

    static #一覧;
    static #表示中;

    static 初期化() {
      画面.#一覧 = new Map([
        ["トップ画面", new トップ()],
        ["ゲーム画面", new ゲーム画面()],
        ["アイテム図鑑", new アイテム図鑑()],
        ["ジョブマスター", new ジョブマスター()],
        ["プロフィール", new プロフィール画面()],
        ["エラー画面", new 画面("エラー")],
        ["404エラー", new 画面("404")]
      ]);
    }

    static 一覧(画面名, エラーを出す = true) {
      return this.#一覧.get(画面名) ?? ((!エラーを出す || console.error(`画面「${画面名}」は存在しません`)) ? undefined : undefined);
    }
  }

  class トップ extends 画面 {
    constructor() {
      super("メイン");
      document.forms.新規登録フォーム.addEventListener("submit", this.#新規登録);
    }

    表示(表示) {
      this.#時刻に合わせてヘッダー背景を変更();
      this.#ランダムなアイコンを表示();
      this.#救出処理の睡眠時間を表示();
      this.#プレイヤー自動削除日数を表示();
      this.#登録者数を表示();
      this.#新規登録可能職業を表示();
      super.表示(表示);
    }

    新規登録完了表示(名前, パスワード, 職業名, 性別, ステータス) {
      for (const [ID, 値] of new Map([
        ["新規登録完了-名前", 名前],
        ["新規登録完了-パスワード", パスワード],
        ["新規登録完了-職業", 職業名],
        ["新規登録完了-性別", 性別],
        ["新規登録完了-ＨＰ", ステータス.ＨＰ],
        ["新規登録完了-ＭＰ", ステータス.ＭＰ],
        ["新規登録完了-攻撃力", ステータス.攻撃力],
        ["新規登録完了-守備力", ステータス.守備力],
        ["新規登録完了-素早さ", ステータス.素早さ]
      ])) {
        $id(ID).textContent = 値;
      }
      const フォーム = document.forms.新規ログイン;
      フォーム.login_name.value = 名前;
      フォーム.pass.value = パスワード;
      $id("new_entry.cgi").hidden = true;
      $id("新規登録完了").hidden = false;
    }

    #時刻に合わせてヘッダー背景を変更() {
      const
        時 = (new Date()).getHours(),
        背景ID
          = 4 > 時 ? 5
            : 6 > 時 ? 6
              : 9 > 時 ? 7
                : 16 > 時 ? 1
                  : 17 > 時 ? 2
                    : 19 > 時 ? 3
                      : 22 > 時 ? 4
                        : 5;
      if (背景ID !== 1)
        $id("トップ-ヘッダー").style.backgroundImage = `url(resource/bg/top/${背景ID}.gif)`;
    }

    #ランダムなアイコンを表示() {
      const
        断片 = document.createElement("div"),
        画像 = document.createElement("img");
      for (let i = 1; i <= 8; i++) {
        // TODO 職業数
        const
          職業ID = Math.floor(Math.random() * 73) + 1,
          性別 = (職業ID == 13 || 職業ID == 15 || 職業ID == 17 || 職業ID == 19 || 職業ID == 47) ? "m"
            : (職業ID == 14 || 職業ID == 16 || 職業ID == 18 || 職業ID == 20 || 職業ID == 48) ? "f"
              : (確率(1 / 2)) ? "m"
                : "f";
        画像.src = `resource/icon/job/${職業ID}_${性別}.gif`;
        断片.appendChild(画像.cloneNode(false));
      }
      const 親 = $id("ランダムアイコン"),
        子 = 親.firstChild;
      if (子) {
        親.removeChild(子);
      }
      親.appendChild(断片);
    }

    #救出処理の睡眠時間を表示() {
      $id("救出処理の睡眠時間").textContent = 分秒表記(救出処理の睡眠秒数);
    }

    #プレイヤー自動削除日数を表示() {
      $id("プレイヤー自動削除日数").textContent = プレイヤー自動削除日数;
      $id("新規プレイヤー自動削除日数").textContent = 新規プレイヤー自動削除日数;
    }

    #登録者数を表示() {
      $id("登録者数").textContent = セーブデータ.登録者数.取得();
      $id("最大登録人数").textContent = 最大登録人数;
    }

    #新規登録可能職業を表示() {
      for (const 職業名 of 初期職業) {
        const option = document.createElement("option");
        option.textContent = 職業名;
        option.value = 職業名;
        document.forms.新規登録フォーム.職業.appendChild(option);
      }
    }

    #新規登録(イベント) {
      イベント.preventDefault();
      const フォーム = イベント.currentTarget;
      メンバー.新規登録(フォーム.名前.value, フォーム.パスワード.value, フォーム.職業.value, フォーム.性別.value);
    }
  }

  class ゲーム画面 extends 画面 {
    constructor() {
      super("party.cgi");
      ゲーム画面.#ログアウトボタン.addEventListener("click", あなた.ろぐあうと);
    }

    更新(場所) {
      ゲーム画面.#ヘッダー.textContent = 空文字列;
      ゲーム画面.#ヘッダー.appendChild(場所.ヘッダー出力());
      ゲーム画面.#メンバー一覧.textContent = 空文字列;
      ゲーム画面.#メンバー一覧.appendChild(場所.メンバー出力());
      ゲーム画面.#メンバー一覧.style.backgroundImage = `url(resource/bg/${場所.背景画像})`;
      ゲーム画面.#こうどう.textContent = 空文字列;
      ゲーム画面.#こうどう.appendChild(場所.こうどう出力());
      ゲーム画面.#チャット欄.textContent = 空文字列;
      ゲーム画面.#チャット欄.appendChild(場所.チャット出力());
      行動ゲージ.リセット();
      super.表示();
      チャットフォーム.フォーカス();
    }

    睡眠時用ログアウトボタンを表示(表示する = true) {
      ゲーム画面.#ログアウトボタン.hidden = !表示する;
    }

    static #ヘッダー = $id("ヘッダー");
    static #メンバー一覧 = $id("メンバー一覧");
    static #こうどう = $id("こうどう");
    static #通知欄 = $id("通知欄");
    static #チャット欄 = $id("チャット欄");
    static #ログアウトボタン = $id("睡眠時用ろぐあうとボタン");
  }

  class アイテム図鑑 extends 画面 {
    constructor() {
      super("アイテム図鑑");
      $id("アイテム図鑑-戻る").addEventListener("click", () => { チャットフォーム.送信();/* TODO 自動更新解除 */ });
    }

    読み込み(データベースイベント) {
      const
        武器一覧 = new Set(),
        防具一覧 = new Set(),
        道具一覧 = new Set();
      for (const アイテム名 of データベースイベント.target.result.map(アイテム.一覧)) {
        const _アイテム = アイテム.一覧(アイテム名);
        if (_アイテム instanceof 武器) {
          武器一覧.add(_アイテム);
        }
        else if (_アイテム instanceof 防具) {
          防具一覧.add(_アイテム);
        }
        else {
          道具一覧.add(_アイテム);
        }
      }
      アイテム.図鑑出力(武器一覧, $id("武器図鑑"));
      アイテム.図鑑出力(防具一覧, $id("防具図鑑"));
      アイテム.図鑑出力(道具一覧, $id("道具図鑑"));
      画面.一覧("アイテム図鑑").表示();
    }
  }

  class ジョブマスター extends 画面 {
    constructor() {
      super("ジョブマスター");
      $id("ジョブマスター-戻る").addEventListener("click", () => { チャットフォーム.送信();/* TODO 自動更新解除 */ });
    }

    読み込み(データベースイベント) {
      const テーブル = $id("ジョブマスター一覧");
      テーブル.textContent = 空文字列;
      テーブル.appendChild(ジョブマスターの職業.図鑑出力(データベースイベント.target.result));
      画面.一覧("ジョブマスター").表示();
    }
  }

  class プロフィール画面 extends 画面 {
    constructor() {
      super("プロフィール");
      $id("プロフィール-戻る").addEventListener("click", () => { チャットフォーム.送信();/* TODO 自動更新解除 */ });
      $id("プロフィール-最大文字数").textContent = プロフィールの最大文字数;
      $id("プロフィール-全角最大文字数").textContent = Math.trunc(プロフィールの最大文字数 / 2);
      document.forms.プロフィール.addEventListener("submit", プロフィール.登録);
    }

    表示画面読み込み(データベースイベント) {
      プロフィール画面.読み込み(データベースイベント, true);
    }

    入力画面読み込み(データベースイベント) {
      プロフィール画面.読み込み(データベースイベント, true);
    }

    static 読み込み(データベースイベント, 入力画面 = false) {
      プロフィール画面.プロフィールを表示(プロフィール.読み込みと出力(データベースイベント, 入力画面), 入力画面);
    }

    static プロフィールを表示(断片, 入力画面 = false) {
      プロフィール画面.#表示画面.hidden = 入力画面;
      プロフィール画面.#入力画面.hidden = !入力画面;
      プロフィール画面.#変更時メッセージ.hidden = 入力画面 || !プロフィール.変更された;
      const 対象テーブル = 入力画面 ? プロフィール画面.#入力画面のテーブル : プロフィール画面.#表示画面のテーブル;
      対象テーブル.textContent = "";
      対象テーブル.appendChild(断片);
      画面.一覧("プロフィール").表示();
    }

    static 名前を設定(名前) {
      for (const 名前欄 of プロフィール画面.#名前欄リスト) {
        名前欄.textContent = 名前;
      }
    }

    static #名前欄リスト = new Set([$id("プロフィール表示画面-プレイヤー名"), $id("プロフィール入力画面-プレイヤー名")]);
    static #変更時メッセージ = $id("プロフィール-変更時メッセージ");
    static #表示画面 = $id("プロフィール表示画面");
    static #表示画面のテーブル = $id("プロフィール表示画面-テーブル");
    static #入力画面 = $id("プロフィール入力画面");
    static #入力画面のテーブル = $id("プロフィール入力画面-テーブル");
  }

  class モンスターブック {
    登録() {
      `$new_no<>$base_name<>$ms{$y}{icon}<>$stage<>$new_strong<>ステータス<>$ms{$y}{get_exp}<>$ms{$y}{get_money}<>$date<>$map<>`;
    }

    読み込み(データベースイベント) {
      const ジョブマスター一覧 = new Set(データベースイベント.target.result.map(ジョブマスターの職業.オブジェクトから));
      for (const _転職可能な職業 of 転職可能な職業.全て()) {
        _転職可能な職業.図鑑用出力();
      }
      画面.一覧("アイテム図鑑").表示();
    }
  }

  class ログインフォーム {
    static 初期化() {
      document.forms.新規ログイン.addEventListener("submit", ログインフォーム.#送信イベント);
      const フォーム = document.forms.ログイン;
      フォーム.addEventListener("submit", ログインフォーム.#送信イベント);
      if (ローカルセーブデータ.getItem("ログイン情報保存日時") + ログイン情報保存日数 * 24 * 60 * 60 * 1000 < Date.now()) {
        ログインフォーム.#ログイン情報削除();
        return;
      }
      if (ローカルセーブデータ.getItem("ログイン情報入力省略")) {
        フォーム.login_name.value = ローカルセーブデータ.getItem("login_name");
        フォーム.pass.value = ローカルセーブデータ.getItem("pass");
        フォーム.login_message.value = ローカルセーブデータ.getItem("login_message");
        フォーム.is_cookie.checked = true;
      }
    }

    static #送信イベント = ((イベント) => {
      イベント.preventDefault();
      const
        フォーム = イベント.currentTarget,
        名前 = フォーム.login_name.value,
        パスワード = フォーム.pass.value,
        メッセージ = フォーム.login_message?.value ?? 空文字列;
      if (ログインフォーム.#メッセージチェック(メッセージ))
        return;
      if (フォーム.is_cookie.checked) {
        ローカルセーブデータ.setItem("login_name", 名前);
        ローカルセーブデータ.setItem("pass", パスワード);
        ローカルセーブデータ.setItem("login_message", メッセージ);
        ローカルセーブデータ.setItem("ログイン情報入力省略", "1");
        ローカルセーブデータ.setItem("ログイン情報保存日時", Date.now());
      }
      else {
        ログインフォーム.#ログイン情報削除();
      }
      あなた.ログイン要求(名前, パスワード, メッセージ);
    }).bind(this);

    static #ログイン情報削除() {
      ローカルセーブデータ.removeItem("login_name");
      ローカルセーブデータ.removeItem("pass");
      ローカルセーブデータ.removeItem("login_message");
      ローカルセーブデータ.removeItem("ログイン情報入力省略");
      ローカルセーブデータ.removeItem("ログイン情報保存日時");
    }

    static #メッセージチェック(メッセージ) {
      if (メッセージ === 空文字列)
        return false;
      try {
        if (/[,;\"\'&<>]/.test(メッセージ))
          throw "メッセージに不正な文字( ,;\"\'&<> )が含まれています";
        if (/　|\s/.test(メッセージ))
          throw "メッセージに不正な空白が含まれています";
        if (ログインメッセージ最大文字数 < 全角を2とした文字列長(メッセージ))
          throw `メッセージが長すぎます(半角${ログインメッセージ最大文字数}文字まで)`;
      }
      catch (エラー内容) {
        エラー.表示(エラー内容);
        return true;
      }
      return false;
    }
  }

  class チャットフォーム {
    static 初期化() {
      document.forms.form.addEventListener("submit", チャットフォーム.送信);
    }

    static フォーカス() {
      チャットフォーム.#入力欄.focus();
    }

    static 文字列追加イベントを登録(要素, テキスト) {
      if (!テキスト) {
        return;
      }
      if (要素.dataset.テキスト !== undefined) {
        要素.dataset.テキスト = テキスト;
        return;
      }
      要素.dataset.テキスト = テキスト;
      要素.addEventListener("click", this.#文字列を追加);
    }

    static 文字列追加イベントを削除(要素) {
      delete 要素.dataset.テキスト;
      要素.removeEventListener("click", this.#文字列を追加);
    }

    static get 内容() { return チャットフォーム.#内容; }
    static set 内容(内容) { チャットフォーム.#内容 = 内容; }

    static 保存した内容を消去() {
      チャットフォーム.#内容 = 空文字列;
    }

    static 送信(イベント) {
      イベント?.preventDefault();
      通知欄.削除();
      const 内容 = チャットフォーム.#入力欄.value;
      if (チャットフォーム.#送信内容確認(内容))
        return;
      チャットフォーム.#内容 = 内容;
      チャットフォーム.#入力欄.value = 空文字列;
      あなた.現在地.更新要求();
    }

    static #文字列を追加(イベント) {
      const テキスト = イベント.currentTarget.dataset.テキスト;
      if (!テキスト)
        return;
      チャットフォーム.#入力欄.value += テキスト;
      チャットフォーム.フォーカス();
    }

    static #送信内容確認(内容) {
      try {
        /*
        if (送信秒数 < 最低送信間隔秒数)
          throw new Error(`最低でも${最低送信間隔秒数}秒以上～～`);
        if (a) {
          通知欄.追加(`まだ行動できません`);
          throw undefined;
        }
        */
        if (最大投稿文字数 < 全角を2とした文字列長(内容))
          throw `本文が長すぎます(半角${最大投稿文字数}文字まで)`;
      }
      catch (エラー内容) {
        エラー.表示(エラー内容);
        return true;
      }
      return false;
    }

    static #内容 = 空文字列;
    static #入力欄 = document.forms.form.コメント;
  }

  class 自動更新 {
    static 初期化() {
      localStorage.getItem("自動更新");
    }

    static 変更時() {
      //  localStorage.setItem("自動更新");
    }

    static カウントダウンリセット() {
      自動更新.#残り秒数 = 自動更新.#間隔秒数;
      if (自動更新.#間隔秒数 !== 0) {
        setTimeout(自動更新.#カウントダウン, 1000);
      }
    }

    static #カウントダウン() {
      if (自動更新.#残り秒数 <= 0) {
        全出力();
        return;
      }
      自動更新.#残り秒数 = ("00" + 自動更新.#残り秒数).substr(("00" + 自動更新.#残り秒数).length - 2, 2);
      自動更新.#次更新までの秒数要素.textContent = 自動更新.#残り秒数;
      自動更新.#残り秒数 = 自動更新.#残り秒数 - 1;
      setTimeout(自動更新.#カウントダウン, 1000);
    }

    static #要素 = document.forms.form.自動更新;
    static #次更新までの秒数要素 = $id("次更新までの秒数");
    static #間隔秒数 = 0; // 0なら無効
    static #残り秒数;
  }

  class 行動ゲージ {
    static リセット() {
      if (行動ゲージ.#ID) {
        clearTimeout(行動ゲージ.#ID);
      }
      this.#残り秒数 = こうどう待ち秒数;
      this.#行動ゲージ.style.width = "0%";
      this.#行動ゲージ.classList.remove("行動ゲージ-完了");
      行動ゲージ.#ID = setTimeout(this.#更新, 1000);
    }

    static #更新() {
      if (行動ゲージ.#残り秒数 <= 1) {
        行動ゲージ.#行動ゲージ.style.width = "100%";
        行動ゲージ.#行動ゲージ.classList.add("行動ゲージ-完了");
        return;
      }
      行動ゲージ.#残り秒数 -= 1;
      const ゲージ幅 = (こうどう待ち秒数 - 行動ゲージ.#残り秒数) / こうどう待ち秒数 * 100;
      行動ゲージ.#行動ゲージ.style.width = ゲージ幅 + "%";
      行動ゲージ.#ID = setTimeout(行動ゲージ.#更新, 1000);
    }

    static #残り秒数;
    static #ID;
    static #行動ゲージ = $id("行動ゲージ");
  }

  class 睡眠タイマー {
    static 作成(秒数) {
      睡眠タイマー.#残り秒数 = 秒数 + 1;
      clearTimeout(睡眠タイマー.#前回タイマーID);
      睡眠タイマー.#カウントダウン();
      return 睡眠タイマー.#要素;
    }

    static #カウントダウン() {
      if (睡眠タイマー.#残り秒数 <= 0) {
        return;
      }
      睡眠タイマー.#残り秒数 -= 1;
      睡眠タイマー.#要素.textContent = 分秒表記(睡眠タイマー.#残り秒数, false, true);
      睡眠タイマー.#前回タイマーID = setTimeout(睡眠タイマー.#カウントダウン, 1000);
    }

    static #残り秒数;
    static #前回タイマーID;
    static #要素 = document.createElement("span");
  }

  class 親ページ {
    get デフォルトページ名() {
      return this.#デフォルトページ名
    }

    get 遷移後リンク無効化() {
      return this.#現在子ページへのリンクを無効化する;
    }

    constructor(名前) {
      this.#子ページリスト = new Map();
      if (!名前) {
        return;
      }
      this.#名前 = 名前;
      const 親ページデータセット = $id(名前).dataset;
      this.#使用パラメーター名 = 親ページデータセット.パラメーター;
      this.#デフォルトページ名 = 親ページデータセット.デフォルトページ;
      this.#同じ子ページからのデフォルトページへの遷移時にパラメータを表示する = (親ページデータセット.パラメータ常時表示 ?? "true") === "true";
      this.#現在子ページへのリンクを無効化する = (親ページデータセット.遷移後リンク無効化 ?? "false") === "true";
    }


    遷移(ページ名 = this.#デフォルトページ名, リンク) {
      if (!this.#子ページリスト.has(ページ名)) {
        エラー.ページが見つかりませんでした();
        return;
      }
      // TODO: 招待ID削除
      URIマネージャー.疑似遷移(this.#相対パス取得(ページ名));
      this.#現在リンク設定(リンク);
      this.#表示(ページ名);
    }

    static 疑似リンク初期化() {
      for (const 疑似リンク of document.getElementsByClassName("疑似リンク")) {
        if (!親ページ.#疑似リンクの確認(疑似リンク)) {
          continue;
        }
        親ページ.#追加(疑似リンク);
      }
      親ページ.トップ表示();
    }

    static トップ表示() {
      親ページ.#一覧.get(undefined).遷移("index.cgi");
    }

    #表示(ページ名) {
      if (this.#表示中) {
        this.#表示中.hidden = true;
      }
      this.#表示中 = this.#子ページリスト.get(ページ名);
      this.#表示中.hidden = false;
    }

    #相対パス取得(ページ名) {
      return (ページ名 === this.#デフォルトページ名 && !this.#同じ子ページからのデフォルトページへの遷移時にパラメータを表示する) ? (
        !this.#名前 ? 親ページ.#ハッシュ
          : `${親ページ.#ハッシュ} ${this.#名前} `
      )
        : (
          !this.#名前 ? 親ページ.#ハッシュ
            : `${親ページ.#ハッシュ} ${this.#名前}?${this.#使用パラメーター名}=`
        ) + ページ名;
    }

    #現在リンク設定(リンク) {
      if (!this.#現在子ページへのリンクを無効化する) {
        return;
      }
      this.#前回リンク?.classList.toggle("現在リンク");
      this.#前回リンク = リンク;
      this.#前回リンク.classList.toggle("現在リンク");
    }

    #名前;
    #使用パラメーター名;
    #デフォルトページ名;
    #子ページリスト;
    #同じ子ページからのデフォルトページへの遷移時にパラメータを表示する;
    #現在子ページへのリンクを無効化する;
    #表示中;
    #前回リンク;

    static #疑似リンクの確認(疑似リンク) {
      if (!疑似リンク.dataset.ページ) {
        console.error(疑似リンク, "上記疑似リンクに属性「data-ページ」が設定されていません");
        return false;
      }
      return true;
    }

    static #追加(疑似リンク) {
      const
        データセット = 疑似リンク.dataset,
        親ページ名 = データセット.親ページ,
        子ページ名 = データセット.ページ,
        親ページ一覧 = 親ページ.#一覧;
      if (!親ページ一覧.has(親ページ名)) {
        親ページ一覧.set(親ページ名, new 親ページ(親ページ名));
      }
      const
        親 = 親ページ一覧.get(親ページ名),
        子ページリスト = 親.#子ページリスト;
      if (!子ページリスト.has(子ページ名)) {
        const 子ページ = $id(親ページ名 ? `${親ページ名}-${子ページ名}` : 子ページ名);
        子ページリスト.set(子ページ名, 子ページ);
        if (親.#デフォルトページ名 === 子ページ名) {
          親.#表示(子ページ名);
          親.#現在リンク設定(疑似リンク);
        }
      }
      疑似リンク.addEventListener("click", 親ページ.#遷移イベント);
      疑似リンク.setAttribute("href", 親.#相対パス取得(データセット.ページ));
    }

    static #遷移イベント = ((イベント) => {
      イベント.preventDefault();
      scrollTo(0, 0);
      const
        要素 = イベント.currentTarget,
        データセット = 要素.dataset;
      親ページ.#一覧.get(データセット.親ページ).遷移(データセット.ページ, 要素);
    }).bind(this);

    static #一覧 = new Map();
    static #ハッシュ = Object.freeze("#");
  }

  class プレイヤー一覧ページ {
    初期化() {
      セーブデータ.getItem();
    }

    更新() {
      セーブデータ.getItem();
    }

    static #要素 = $id("player_list.html");
  }

  class ニュース {
    static 書き込み(内容) {
      データベース操作.ニュースを追加([内容]);
    }
  }

  class 伝説のプレイヤー {

  }

  class プロフィール {
    constructor(名前) {
      this.#名前 = 名前;
    }

    値を設定(値 = 空文字列) {
      if (this.#値 === 値) {
        return false;
      }
      this.#値 = 値;
      return true;
    }

    出力(入力画面) {
      // TODO tr余分
      const
        断片 = document.createDocumentFragment(),
        tr1 = document.createElement("tr"),
        th = document.createElement("th"),
        td = document.createElement("td");
      tr1.classList.add("プロフィール行")
      th.textContent = this.#名前;
      th.classList.add("プロフィール項目名");
      tr1.appendChild(th);
      td.classList.add("プロフィール内容");
      if (入力画面) {
        td.classList.add("プロフィール入力");
        const input = document.createElement("input");
        input.name = this.名前;
        input.value = this.#値;
        input.classList.add("text_box_b", "プロフィール入力欄");
        td.appendChild(input);
      }
      else {
        td.textContent = this.#値;
      }
      tr1.appendChild(td);
      断片.appendChild(tr1);
      return 断片;
    }

    get 名前() { return this.#名前; }

    static 読み込みと出力(データベースイベント, 入力画面 = false) {
      if (入力画面) {
        プロフィール.変更された = false;
      }
      const プロフィールデータリスト = (データベースイベント === undefined) ? new Map()
        : new Map(データベースイベント.target.result.map(({ 名前, 値 }) => [名前, 値]));
      const 断片 = document.createDocumentFragment();
      for (const _プロフィール of プロフィール.#一覧) {
        const 値 = プロフィールデータリスト.get(_プロフィール.名前);
        if (_プロフィール.値を設定(値)) {
          プロフィール.変更された = true;
        }
        if (入力画面 || 値 !== 空文字列) {
          断片.appendChild(_プロフィール.出力(入力画面));
        }
      }
      return 断片;
    }

    static 登録(イベント) {
      イベント.preventDefault();
      プロフィール.変更された = false;
      const 保存データ = new Set();
      const 断片 = document.createDocumentFragment();
      for (const _プロフィール of プロフィール.#一覧) {
        const
          名前 = _プロフィール.名前,
          値 = document.forms.プロフィール[名前].value;
        if (_プロフィール.値を設定(値)) {
          if (プロフィール.#登録チェック(名前, 値))
            return;
          プロフィール.変更された = true;
          保存データ.add({ 名前, 値 });
        }
        if (値 !== 空文字列) {
          断片.appendChild(_プロフィール.出力());
        }
      }
      プロフィール画面.プロフィールを表示(断片);
      あなた.メンバー.プロフィールを更新(保存データ);
    }

    static 初期化() {
      // プロフィール.#一覧 = new Map([
      プロフィール.#一覧 = new Set([
        "名前",
        "性別",
        "血液型",
        "誕生日",
        "年齢",
        "職業",
        "住んでいる所",
        "趣味",
        "マイブーム",
        "オススメサイト",
        "夢/目標",
        "性格・特徴",
        "好きなもの",
        "嫌いなもの",
        "好きな食べ物",
        "嫌いな食べ物",
        "このゲームの目標",
        "ログイン時間",
        "自慢",
        "このサイトを知ったきっかけ",
        "何か一言"
      ].map(プロフィール.#一覧へ));
    }

    #名前;
    #値;

    static #一覧へ(項目名) {
      // return [項目名, new プロフィール(項目名)];
      return new プロフィール(項目名);
    }

    static #登録チェック(項目名, 内容) {
      try {
        if (プロフィール.#不正な文字が含まれているか.test(内容))
          throw `${項目名} に不正な文字( \;<> )が含まれています`;
        if (全角を2とした文字列長(内容) > プロフィールの最大文字数)
          throw `${項目名} は全角${Math.trunc(プロフィールの最大文字数 / 2)}(半角${プロフィールの最大文字数})文字以内です`;
      }
      catch (エラー内容) {
        エラー.表示(エラー内容);
        return true;
      }
      return false;
    }

    static #一覧;
    static #不正な文字が含まれているか = new RegExp(/[;<>]/);
  }

  class フォトコン景品 {
    constructor(小さなﾒﾀﾞﾙ, 賞金, ギルドポイント) {
      this.#小さなﾒﾀﾞﾙ = 小さなﾒﾀﾞﾙ;
      this.#賞金 = 賞金;
      this.#ギルドポイント = ギルドポイント;
    }

    #小さなﾒﾀﾞﾙ;
    #賞金;
    #ギルドポイント;
  }

  class URIマネージャー {
    static 初期化() {
      const [ページ部, パラメータ部] = location.hash.replace("#", 空文字列).split("?");
      URIマネージャー.#ページ = decodeURI(ページ部);
      URIマネージャー.#パラメータ = new URLSearchParams(パラメータ部);
      window.addEventListener("hashchange", URIマネージャー.hashHandler, false);
    }

    static hashHandler() {
      console.log("ハッシュが変更されました！");
    }

    static get ページ() { return URIマネージャー.#ページ; }
    static set ページ(ページ名) {
      if (URIマネージャー.#ページ === ページ名)
        return;
      URIマネージャー.#ページ = ページ名;
      URIマネージャー.疑似遷移();
    }

    static パラメータ取得(パラメーター名) {
      return URIマネージャー.#パラメータ.get(パラメーター名);
    }

    static パラメータ追加(パラメーター名) {
      return URIマネージャー.#パラメータ.get(パラメーター名);
    }

    static パラメータリセット() {

    }

    static 疑似遷移(疑似ページ名) {
      history.pushState(null, "", `${location.origin}${location.pathname}${疑似ページ名} `);
    }

    static #_疑似遷移(ページ = URIマネージャー.#ページ, パラメーター = URIマネージャー.#パラメータ.toString()) {
      console.trace(パラメーター);
      history.pushState(null, "", `${location.origin}${location.pathname}#${ページ}${パラメーター ? `?${パラメーター}` : 空文字列}`);
    }

    static #ページ;
    static #パラメータ;
  }

  const
    全出力 = () => {
      あなた.現在地.ヘッダー出力();
      メンバーマネージャー.出力();
      自動更新.初期化();
      こうどうマネージャー.出力();
      あなた.現在地.チャット出力();
    },
    分秒表記 = (秒数, 秒が無い場合に省略する = true, 秒の0埋め = false) =>
      (秒が無い場合に省略する && (秒数 % 60 === 0))
        ? `${Math.round(秒数 / 60)} 分` // 小数が怪しいのでround
        : `${Math.trunc(秒数 / 60)}分${秒の0埋め && 秒数 < 10 ? "0" : 空文字列}${秒数 - Math.trunc(秒数 / 60) * 60}秒`,
    メンテナンスチェック = () => {
      if (メンテナンス予定分数) {
        エラー.表示(`現在メンテナンス中です。しばらくお待ちください(約 ${メンテナンス予定分数} 分間)`);
        return true;
      }
      return false;
    };

  const
    // $VERSION $copyright $title_img は html へ
    // $gage_width は css.行動ゲージ背景 へ
    // @reload_times はめんどいので削除
    // $script_index は html と js へ
    // html上の $method, $script, $id, $pass はどうせjs側で送信するときに不要なので削除
    // $home はリンク切れのため削除
    // 新規登録時のデフォルトステータスは メンバー.新規登録() 内で定義
    ローカルセーブデータ = localStorage,
    メンテナンス予定分数 = 0,
    こうどう待ち秒数 = 7,
    ログインリストへの表示秒数 = 60 * 15,
    最大登録人数 = 200,
    最大ログイン人数 = 30,
    プレイヤー自動削除日数 = 30,
    新規プレイヤー自動削除日数 = 7,
    最大ログ保存件数 = 30,
    最大アイテム預かり個数 = 100,
    最大モンスター預かり体数 = 50,
    モンスターブックコンプリートに必要な体数 = 180,
    ログイン情報保存日数 = 30,
    ログインメッセージ最大文字数 = 60,
    プレイヤー一覧の更新周期日数 = 1,
    ギルド一覧の更新時のギルドポイント減少時の係数 = 0.8,
    フォトコン実施周期日数 = 10,
    フォトコン最少決行人数 = 5,
    フォトコン景品一覧 = Object.freeze({
      1: new フォトコン景品(10, 15000, 700),
      2: new フォトコン景品(6, 7000, 300),
      3: new フォトコン景品(3, 3000, 100)
    }),
    プロフィールの最大文字数 = 160,
    ランキング表示人数 = 10,
    睡眠秒数 = 0.1 * 60,
    // 睡眠秒数 = 15 * 60,
    救出処理の睡眠秒数 = 睡眠秒数 * 2,
    更新連打の睡眠秒数 = Object.freeze(new Map([
      [30, 60 * 60 * 24 * 7],
      [25, 60 * 60 * 24 * 3],
      [20, 60 * 60 * 24],
      [15, 60 * 60 * 3],
      [10, 60 * 60]
    ])),
    NPC色 = "#FF69B4",
    メンバー表示秒数 = 60 * 5,
    最大投稿文字数 = 500,
    疲労限界 = 100,
    転職時の最低ステータス = Object.freeze(new 簡易ステータス(10, 10, 10, 10, 10)),
    アイテム種類 = new Map([
      ["武器", Symbol("武器")],
      ["防具", Symbol("防具")],
      ["道具", Symbol("道具")]
    ]),
    初期職業 = Object.freeze(new Set(["戦士", "剣士", "弓使い", "魔物使い"])),
    デフォルトの職業アイコン名 = "resource/icon/chr/098.gif",
    チャットのデフォルトのNPC名 = "＠",
    カジノのスロットの記号リスト = [
      new スロットの記号("∞", 10, 3),
      new スロットの記号("♪", 20),
      new スロットの記号("†", 50),
      new スロットの記号("★", 70),
      new スロットの記号("７", 100)
    ],
    特別な福引の必要枚数 = 300,
    通常の福引の必要枚数 = 3,
    福引の台詞 = Object.freeze({
      特別な特賞() { return `！！！えっ！？あれっ！？なんだこれは？！え～と…ハズレです！………な、なんですか！？…わかりましたよ。他の人には内緒ですよ。`; },
      特別なアタリ(賞品名) { return `おおっ！${賞品名}が出ました～！おめでとうございま～す！こちらが${賞品名}になります！`; },
      特別なハズレ() { return `おおっ！ホワイトオーブが出ました～！って…それはハズレです…`; },
      特賞(賞品名, 等級) { return `！！！えっ！？えっ！？お、大当たり～！大当たり～！あれ？出ないはずなのにな…ｺﾞﾆｮｺﾞﾆｮ。お、おめでとうございます！${等級}です！${等級}が出ました～！どうぞ！こちらが${等級}の${賞品名}です！お受け取りください！`; },
      超激レア(賞品名, 等級) { return `！！おっ！大当たり～！大当たり～！おめでとうございます！${等級}が出ました～！こちらが${等級}の${賞品名}です！`; },
      激レア(賞品名, 等級) { return `大当たり～！大当たり～！おめでとうございます！${等級}が出ました～！こちらが${等級}の${賞品名}です！`; },
      超レア(賞品名, 等級) { return `おおっ、当たりで～す！おめでとうございま～す！${等級}が出ました～！こちらが${等級}の${賞品名}です！`; },
      レア(賞品名, 等級) { return `当ったり～！おめでとうございます！${等級}の${賞品名}です！` },
      普通(賞品名, 等級) { return `おめでとう。${等級}の${賞品名}で～す！`; },
      ハズレ() { return `ハズレです…`; }
    }),
    追放申請の必要票数 = 40,
    追放申請が却下されたプレイヤーの拘束日数 = 25,
    追放申請数個人上限 = 1,
    // 依頼数はデータベースの初回作成時に決定される 以降変更したい場合は頑張る
    何でも屋の依頼数 = 9,
    何でも屋の解決期限日数 = 6,
    何でも屋のレア依頼の確率 = 1 / 14,
    何でも屋のアイテム依頼の最小必要数 = 2,
    何でも屋のアイテム依頼の最大必要数 = 4,
    何でも屋の魔物依頼の最小必要数 = 1,
    何でも屋の魔物依頼の最大必要数 = 2,
    何でも屋のギルド依頼の確率 = 1 / 15,
    何でも屋のギルド依頼の必要数倍率 = 2,
    何でも屋のギルド依頼の固定報酬 = "幸福袋",
    いどう先の表示で改行する項目数 = 7,
    教える言葉の最大文字数 = 120,
    サンプル色リスト = new Map([
      ["#FF3333", "レッド"],
      ["#FF33CC", "ピンク"],
      ["#FF9933", "オレンジ"],
      ["#FFFF33", "イエロー"],
      ["#33FF33", "グリーン"],
      ["#33CCFF", "アクア"],
      ["#6666FF", "ブルー"],
      ["#CC66FF", "パープル"],
      ["#FFFFFF", "ホワイト"],
      ["#CCCCFF", "グレイ"],
      ["#33FF99", "エメラルド"]
      // TODO 戦闘用にはNPC色/デフォルト色/エメラルドがない、さらにグレイが#CCCCCC
    ]),
    有効なカラーコードか = new RegExp(/#[0-9a-fA-F]{6}/),
    ジョブマスターの1行の職業数 = 10,
    性別をアイコン名に = Object.freeze({
      女: "f",
      男: "m"
    }),
    一時的な場所の自動削除秒数 = 1800
    ;

  アイテム.初期化();
  場所.初期化();
  セーブデータ.読み込み();
  画面.初期化();
  URIマネージャー.初期化();
  //全出力();
  //  エラー.表示("aaaaaaaaaaa");
  画面.一覧("トップ画面").表示();
  親ページ.疑似リンク初期化();
  ログインフォーム.初期化();
  チャットフォーム.初期化();
  転職可能な職業.初期化();
  ちゅうもん.初期化();
  錬金レシピ.初期化();
  プロフィール.初期化();
  何でも屋の依頼.初期化();
  闇市場.初期化();
  壁紙.初期化();
  setTimeout(() => データベース操作.初期化());

  if ($$$___新規登録フォームに値を自動入力する___$$$) {
    document.forms.新規登録フォーム.名前.value = "あ";
    document.forms.新規登録フォーム.パスワード.value = "qweqrtta";
  }


});


# 社会マスター 7日間復習 修正・検証結果

2026年9月20日。7日間復習の実装を完了し、元の作業フォルダーへ反映済みです。更新版は v11.2 です。3D地図は今回の変更・検査対象外です。公開サイトへのデプロイは行っていません。

対象フォルダー: `C:\Users\calcu\OneDrive\デスクトップ\koki\GPT\bonsai\作業フォルダー\拓士社会`

## 保全と事前調査

- 修正前の全30ファイルを別コピーと `social-master-before-repair.zip` に保存。元ファイルとのSHA-256一致を確認し、一覧を `before-sha256.json` に記録しました。
- 統合パックZIP内のREADME.md、weekly-review.patch、base-sha256.jsonが作業フォルダーの同名ファイルと一致することを確認しました。
- 同梱v11.0 ZIPの対象ファイルがbase-sha256.jsonの基準ハッシュと一致することを確認しました。現状との比較ではapp.jsだけが変更されており、weekly-review.jsが追加済みでした。問題データなどに独自の変更はありませんでした。
- 修正前のapp.jsとweekly-review.jsは `node --check` に成功。引用符の構文破損は残っていませんでしたが、renderQuestion内の週間復習条件が重複し、機能の統合が途中の状態でした。
- 修正前の既存テストは6本成功、compat-test.jsの1本が `WeeklyReview` 未読み込みによる起動時エラーで失敗。weekly-review-test.jsは未配置でした。修正前ログは `tests-before.txt` です。

## 修正内容

パッチを設計資料として未適用の差分を統合し、app.jsの変更済み箇所は必要部分だけを修正しました。既存の誤答記録用関数、回答時の記録処理、結果タイトルの表記、履歴のweeklyフラグを維持しました。weekly-review.jsは一切変更していません。

| ファイル | 対応 |
| --- | --- |
| app.js | 重複条件を除去。復習履歴を全範囲として保存。週間復習からの再復習、バックアップ復元、消去時の説明、ボタン接続、画面復帰時の件数更新を統合 |
| index.html | TOPの復習パネル・件数・ボタンを追加。weekly-review.jsをapp.jsより前に読み込み |
| styles.css | パック指定の復習パネル用スタイルを追加 |
| sw.js / manifest.webmanifest | 復習スクリプトのキャッシュ追加、アイコン等の参照を更新 |
| tests/app-static-test.js / tests/compat-test.js / tests/pwa-assets-test.js | パックの検査変更を統合。読み込み順、CSSのキャッシュ一致、v11.0・v11.1旧キャッシュの更新対象も検査 |
| tests/weekly-review-test.js | パックの復習テストを追加。既存称号とPINがある状態での維持、正解時に誤答時刻が延長されないことも検査 |

途中状態のapp.jsには既にv11.1の識別子があったため、READMEの次版指定に従い、表示・アセットURL・音声・キャッシュ名をv11.2へ統一しました。CSSにも同じ更新識別子を付与しました。

既存8ファイル変更、新規テスト1ファイル追加。その他22ファイルはバイト単位で変更なしです。問題データ729問、画像、音声、既存復習モジュール、受領した仕様書・パッチ・ZIPを維持しました。ブラウザーの実際の学習記録・設定・PINデータにはアクセスしていません。

反映直前に元の全30ファイルのハッシュとファイル数を再確認し、作業中に別の変更が入っていないことを確認しました。反映後は全31ファイルが検証済みコピーと一致しています。変更一覧は `changes.json`、反映後ハッシュは `installed-sha256.json`、修正差分は `repair-diff.patch` です。差分は修正前への適用チェック・修正後からの逆適用チェックともに成功しています。

## 最終検証

元の作業フォルダーに反映後、Node.js v24.19.0で再実行しました。全コマンドの終了コードは0です。完全なログは `tests-final.txt`、機械可読の結果は `verification.json` です。

| コマンド | 結果 |
| --- | --- |
| node tests/app-static-test.js | PASS |
| node tests/compat-test.js | PASS |
| node tests/data-test.js | PASS |
| node tests/distractor-quality-test.js | PASS |
| node tests/legacy-integrity-test.js | PASS |
| node tests/lower-content-test.js | PASS |
| node tests/pwa-assets-test.js | PASS |
| node tests/weekly-review-test.js | PASS |

JavaScript全13ファイルの `node --check`、index.html内のインラインスクリプト1本の構文検査、manifestのJSON構文検査も成功しました。

7日間復習について、168時間ちょうどで除外、未来時刻・不正時刻・存在しない問題IDの除外、方式ごとの重複排除、最後の誤答時刻の更新、回答直後の保存、途中終了、記述の△・×のみ記録、全範囲抽出、採点と履歴、正解後の再練習、称号・ランク・PINの維持、新旧バックアップ復元、履歴消去、0件時のボタン無効化を検証しました。

## 確認範囲

画面イベントと保存処理はNode.jsの模擬DOMでの自動検査です。実ブラウザーでの表示操作・Service Workerのオフライン再読込、実iPadの表示・操作・音声は未確認です。3D地図は保留のままです。

`social-master-v11.2.zip` はv11.0配布ファイル群に今回の修正と復習モジュール・テストを反映し、この報告書を同梱したものです。`README.txt` と `QUESTION_REVIEW_v11.md` は既存の資料をそのまま保存しています。元の統合指示書およびパック作成時の `test-results.txt` も作業フォルダーでは変更せず、本作業の結果はこの報告書と別添ログに分離しています。

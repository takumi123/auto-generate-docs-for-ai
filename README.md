# AI開発用ドキュメント自動生成拡張機能

AIを使用したコーディング時に、AIが仕様を理解するための包括的なドキュメントをボタン一つで自動生成するVSCode拡張機能です。

## 主な機能

- 🎯 **ワンクリックでドキュメント生成**: コードベースの詳細なドキュメントをボタン一つで生成
- 🌳 **インタラクティブなファイルツリー**: ドキュメント化したいファイルやディレクトリを選択可能
- 🔒 **安全なAPI管理**: OpenRouter APIキーを安全に保存・管理
- 📝 **包括的なドキュメント**: 以下の項目を網羅したドキュメントを生成:
  - システムレベルのアーキテクチャ
  - プログラムレベルの詳細
  - API/データベース設計
  - テスト/品質管理
  - インフラストラクチャ設定

## 必要要件

- VSCode 1.89.1以上
- OpenRouter APIキー（Gemini Pro 1.5にアクセスするため）

## インストール方法

1. VSCodeマーケットプレイスから拡張機能をインストール
2. "Set OpenRouter API Key"コマンドでAPIキーを設定
3. AIドキュメントジェネレーターのサイドバーを開いて使用開始

## 使用方法

1. VSCodeでAIドキュメントジェネレーターのサイドバーを開く
2. まだ設定していない場合は、OpenRouter APIキーを設定
3. インタラクティブなファイルツリーからドキュメント化したいファイルを選択
4. "Generate Documentation for Selected Files"をクリック
5. 生成されたドキュメントはデフォルトで`docs_for_ai/summary.md`に保存されます

## 技術的な特徴

- OpenRouter APIを介してGoogle Gemini Pro 1.5モデルを使用
- アニメーション付きステータスバーでリアルタイムの進捗表示
- VSCodeの組み込みシークレットストレージを使用した安全なAPIキー管理
- ファイルシステムの監視による自動ツリー更新
- 特殊なドキュメント生成のためのカスタムシステムプロンプトをサポート

## 生成されるドキュメントの形式

生成されるドキュメントは以下の項目を網羅します：

### システムレベル
- 処理フローとモジュールの責任範囲
- 実装されているアルゴリズム
- 入出力の仕様
- 例外処理メカニズム
- データ構造

### プログラムレベル
- 関数/メソッドのドキュメント
- パラメータと戻り値の詳細
- 変数の使用状況
- 定数と設定ファイル
- 関数の事前/事後条件

### API/データベース設計
- ステータスコード
- エラーレスポンスのフォーマット
- データベーススキーマ
- インデックスと制約
- データベースのリレーション

### テスト/品質管理
- テストケース
- テストデータ
- コーディング規約
- テストカバレッジ
- エッジケース

### インフラストラクチャ
- システムインフラ
- ビルドプロセス
- デプロイメントプロセス
- 環境パラメータ
- テスト環境のセットアップ

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。


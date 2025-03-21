## Storybook でモジュールをモックする方法について

### STEP1 Storybook8 系 + Create React App 環境を作る

typescript において以下のように baseUrl を指定するが、`components/Sample`で`src/components/Sample`にたどり着けずモジュールエラーになる。
理由は、Create React App 内に webpack が隠蔽されている状況のため、typescript のパス解決ができても CRA 内部において JavaScript 側の解決ができていないため。

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "baseUrl": "src"
  },
  "include": ["src/**/*", "additional.d.ts"],
  "exclude": ["node_modules", "**/*.mdx"]
}
```

これ自体は元々いろんなところで議論されている問題。
https://zenn.dev/hk_206/articles/6345ec00a8da33

解決策として、`babel-plugin-macros`と`@types/babel-plugin-macros`を開発依存関係に入れたうえで babel の設定を追記する。

```.babelrc
{
    "plugins": ["macros"]
}
```

まっっっっっっったくなぜかわからない。TODO: 調べる。

また、Storybook 上だと`tscofnig.json`のエイリアスの設定がきかずにインポートエラーになる。
`tsconfig-paths-webpack-plugin`を開発依存関係に入れたうえで`.storybook/main.ts`をいじる。

```.tsx
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

const config: StorybookConfig = {
  webpackFinal: async (config) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    config.resolve.plugins = [new TsconfigPathsPlugin()];
    return config;
  },
}
```

`baseUrl`が反映されない
https://zenn.dev/enish/articles/cde07d3d22f95b

### Step2 subpath imports を利用してモックができるようにする

サブパスモジュールがうまく行ったコミット: 6424809b18f7983308f1f75c3bca1142b753db06

package.json

```json
{
  "imports": {
    "#lib/session": {
      "storybook": "./src/lib/session.mock.ts",
      "default": "./src/lib/session.ts"
    },
    "#*": "./*"
  }
}
```

tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "baseUrl": "src",
    "paths": {
      "#*": ["*"]
    }
  },
  "include": ["src/**/*", "additional.d.ts"],
  "exclude": ["node_modules", "**/*.mdx"]
}
```

src/lib/session.ts

```ts
export function getLocalStorageItem(
  key: string
): { hoge: string; fuga: number } | null {
  console.log("honmono ga yobaretayo");
  const item = localStorage.getItem(key);
  return item ? (JSON.parse(item) as { hoge: string; fuga: number }) : null;
}

export function setLocalStorageItem(
  key: string,
  value: { hoge: string; fuga: number }
): void {
  console.log("honmono ga yobaretayo");
  localStorage.setItem(key, JSON.stringify(value));
}
```

src/lib/session.mock.ts

```ts
import { fn } from "@storybook/test";
import * as actual from "./session";

export const getLocalStorageItem = fn(actual.getLocalStorageItem).mockName(
  "getLocalStorageItem"
);
export const setLocalStorageItem = fn(actual.setLocalStorageItem).mockName(
  "setLocalStorageItem"
);
```

src/components/Sample/index.tsx

```tsx
import { getLocalStorageItem, setLocalStorageItem } from "#lib/session";
import { FC } from "react";

export const Sample: FC = () => {
  setLocalStorageItem("sample", { hoge: "ほげ", fuga: 42 });
  const storage = getLocalStorageItem("sample");
  return (
    <div>
      hogeとfugaについて！
      <p>hoge: {storage?.hoge}</p>
      <p>fuga: {storage?.fuga}</p>
    </div>
  );
};
```

src/components/Sample/index.stories.tsx

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Sample } from "./index";
import { getLocalStorageItem, setLocalStorageItem } from "#lib/session.mock";
// ...
export const Primary: Story = {
  async beforeEach() {
    setLocalStorageItem.mockReturnValue();
    getLocalStorageItem.mockReturnValue({ hoge: "mock hoge", fuga: 1000 });
  },
};
```

.storybook/main.ts

```ts
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  // ...
  webpackFinal: async (config) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    // この指定をしてはいけないのがミソ！！！！！
    // config.resolve.plugins = [new TsconfigPathsPlugin()];
    return config;
  },
};
export default config;
```

これでサブパスモジュールができる。

`tsconfig-paths-webpack-plugin`のインポートをしてはいけないのがポイント。
https://www.npmjs.com/package/tsconfig-paths-webpack-plugin

`tsconfig-paths-webpack-plugin`は tsconfig.json のエイリアス設定を webpack 設定に上書きする。
今回の場合は Storybook 上の webpack で上書きしていた。特に`baseUrl`や`paths`を指定している時にこの設定を入れてしまうと、Storybook がサブパスモジュールを通らなくなってしまいエラーになる。おそらく事前に`config.resolve.alias`に色々と書き込みをしたものがあっても、プラスイン発火のタイミングで`tsconfig-paths-webpack-plugin`がそれを全面的に上書きしてしまっている気がします。そのため、`package.json`の`imports`属性のいうことを聞かない…みたいなことがあり得そう。

https://github.com/dividab/tsconfig-paths-webpack-plugin/issues/8

### Step3 builder Alias を利用してモックができるようにする

ビルダーエイリアスがうまく行ったコミット: 208c4b65b59e9173ce3bb88bf0e53146754f794a

package.json は imports 属性を消す

tsconfig.json

```json
{
  "compilerOptions": {
    // ...
    "baseUrl": "src"
  },
  "include": ["src/**/*", "additional.d.ts"],
  "exclude": ["node_modules", "**/*.mdx"]
}
```

src/components/Sample/index.tsx

```tsx
import { getLocalStorageItem, setLocalStorageItem } from "lib/session";
import { FC } from "react";
import { Child } from "components/Child";

export const Sample: FC = () => {
  setLocalStorageItem("sample", { hoge: "ほげ", fuga: 42 });
  const storage = getLocalStorageItem("sample");
  return (
    <div>
      hogeとfugaについて！
      <p>hoge: {storage?.hoge}</p>
      <p>fuga: {storage?.fuga}</p>
      <Child />
    </div>
  );
};
```

src/components/Sample/index.stories.tsx

```tsx
import type { Meta, StoryObj } from "@storybook/react";

import { Sample } from "./index";
import { getLocalStorageItem, setLocalStorageItem } from "lib/session.mock";

// ...

export const Primary: Story = {
  async beforeEach() {
    setLocalStorageItem.mockReturnValue();
    getLocalStorageItem.mockReturnValue({ hoge: "mock hoge", fuga: 1000 });
  },
};
```

.storybook/main.ts

```ts
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "node:path";

const config: StorybookConfig = {
  ...
  webpackFinal: async (config) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    // ここを入れるとmockを参照しなくなる
    // config.resolve.plugins = [new TsconfigPathsPlugin()];
    config.resolve.alias = {
      ...config.resolve?.alias,
      "lib/session": path.resolve(__dirname, "../src/lib/session.mock.ts"),
    };
    return config;
  },
};
export default config;
```

### まとめ

Subpath vs Builder においては、本番の方に全く影響を与えない Builder のほうが良さそうと判断。
また、Subpath Import は形式的に`#`をつけるのが良いとされているため、大規模なパス回収が発生する可能性も場合によってある。
これから既存の Storybook に回収を入れるなら BuilderAlias の採用が良さそう。

Storybook のモジュールモックのアプローチは、パスエイリアスを利用してファイルそのものをモックに置き換えるというアプローチ。
エイリアスがうまく晴れていない要素があると絶対にうまくいかないので、うまくいかない場合はエイリアスを疑うと良さそう。

今回の場合は`tsconfig-paths-webpack-plugin`が全面的に悪さをしていたというお話。

### 参考

https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules#subpath-imports

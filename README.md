## 　 Storybook でモジュールをモックする方法について

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

また、Storybook 上だと`.tscofnig.json`のエイリアスの設定がきかずにインポートエラーになる。
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

サブパスモジュールがうまく行ったコミット: 06e49e6cd79cddc3f5230ad4813322f4442fc091

### わかってきたこと

### 参考

https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules#subpath-imports

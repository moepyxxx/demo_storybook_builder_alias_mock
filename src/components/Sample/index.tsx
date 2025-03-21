import { getLocalStorageItem, setLocalStorageItem } from "lib/session";
import { FC } from "react";

export const Sample: FC = () => {
  setLocalStorageItem("sample", { hoge: "ほげ", fuga: 42 });
  const storage = getLocalStorageItem("sample");
  return (
    <div>
      <p>hoge: {storage?.hoge}</p>
      <p>fuga: {storage?.fuga}</p>
    </div>
  );
};

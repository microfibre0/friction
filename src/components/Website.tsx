import { useState } from "react";
type Props = {
  func?: () => void;
  title?: string;
  src?: string;
  bg?: string;
  gradient?: string;
  index?: string;
  name?: string;
  btn_tmr?: boolean;
  hide_img?: boolean;
};

function Website({ bg, gradient, src }: Props) {
  const height = "90px";
  const width = "300px";
  const [settings, settingsVis] = useState(false);
  return (
    <>
      <div
        className={`relative`}
        style={{ background: `${bg}`, height: `${height}`, width: `${width}` }}
        onClick={() => {
          settingsVis(!settings);
        }}
      >
        <img
          src={src}
          alt="Plus"
          className=" absolute top-[10px] left-[15px] h-[70px] w-[70px]"
        />
        <div
          className={`absolute z-20`}
          style={{
            background: `linear-gradient(to left, ${gradient} 50%, transparent)`,
            height: `${height}`,
            width: `${width}`,
          }}
        ></div>
        <div className="border absolute bottom-0 right-0 w-[200px] h-[60px] z-30"></div>
      </div>

      {settings && (
        <div
          className="absolute w-8/12 h-8/12 left-2/12 top-2/12 border z-40"
          style={{ background: gradient }}
        ></div>
      )}
    </>
  );
}

export default Website;

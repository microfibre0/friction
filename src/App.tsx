import "./App.css";
import Website from "./components/Website";
import plus from "./assets/gray plus.svg";
import { useState } from "react";
function App() {
  const bg_dark = "#202020";
  const [state, updateState] = useState(true);
  let websites = {};
  /*const add_website = (
    index: string,
    name: string,
    btn_tmr: boolean,
    hide_img: boolean,
  ) => {
    chrome.storage.sync.set({
      [index]: { name: name, btn_tmr: btn_tmr, hide_img: hide_img },
    });
  };*/

  const getSites = async () => {
    // gets websites, converts to [[key], {key:val}]
    const storage = await chrome.storage.sync.get();
    websites = storage;
    updateState(!state);
  };
  getSites();
  console.log(websites);

  return (
    <>
      <div className={`h-[500px] w-[300px] border bg-[${bg_dark}]`}>
        <div className="h-1/12 flex justify-center items-center">
          <h1 className="text-3xl ">friction</h1>
        </div>
        <div className="h-11/12 ">
          <h2 className="text-2xl h-[50] flex justify-center bg-gray-600">
            websites
          </h2>
          <Website bg={"#707070"} gradient={"#999999"} src={plus} />
        </div>
      </div>
    </>
  );
}

export default App;

import "./App.css";
import Website from "./components/Website";
import { useState, useRef } from "react";
function App() {
  interface model {
    [key: string]: unknown;
  }

  const bg_dark = "#202020";
  const [websites, setWebsites] = useState<model>({
    name: { btn_tmr: true, hide_img: true },
  });
  const updated = useRef(false);

  const getSites = async () => {
    // retries site options from chrom storage
    if (
      JSON.stringify(websites) ===
      JSON.stringify({
        name: { btn_tmr: true, hide_img: true },
      })
    ) {
      // stringifiead as you cant compare normally
      const storage = await chrome.storage.sync.get();
      setWebsites(storage);
      updated.current = true;
    }
  };
  /*
  const add_website = (name: string, btn_tmr: boolean, hide_img: boolean) => {
    //way to populat storage for dev use
    chrome.storage.sync.set({
      [name]: { btn_tmr: btn_tmr, hide_img: hide_img },
    });
  };
*/
  getSites();

  const btn_qu: boolean = updated.current
    ? (websites as { [name: string]: { btn_tmr: boolean } }).facebook.btn_tmr
    : false;

  const hide_qu: boolean = updated.current
    ? (websites as { [name: string]: { hide_img: boolean } }).facebook.hide_img
    : false;

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
          {Object.keys(websites).map((website) => (
            <Website
              name={website}
              btn_tmr={btn_qu}
              hide_img={hide_qu}
              bg={"#3b3b3b"}
              gradient={"#737373"}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;

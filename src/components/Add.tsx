import { useState, useRef } from "react";

function Add() {
  const [visible, setVisible] = useState(false);
  const addWebsite = async (
    name: string,
    url: string,
    btn_tmr: boolean = false,
    hide_img: boolean = false,
  ) => {
    //website name: {website mod: true/false}
    await chrome.storage.sync.set({
      [name]: { url: url, btn_tmr: btn_tmr, hide_img: hide_img },
    });
    console.log(chrome.storage.sync.get());
  };

  const handleInput = (event: { target: { name: unknown; value: string } }) => {
    switch (event.target.name) {
      case "website":
        return (website.current = event.target.value);

      case "url":
        return (url.current = event.target.value);
    }
  };

  const website = useRef<string>("");
  const url = useRef<string>("");

  return (
    <>
      <img
        className="border size-5 ml-3"
        onClick={() => {
          setVisible(!visible);
        }}
      />
      {visible && (
        <div
          className="absolute w-8/12 h-8/12 left-2/12 top-2/12 border p-2 z-40 grid grid-cols-2 grid-rows-4"
          style={{ background: "grey" }}
        >
          <div>
            <p>website</p>
            <input
              name="website"
              className="border rounded"
              onChange={handleInput}
            />
          </div>
          <div>
            <p>url</p>
            <input
              name="url"
              className="border rounded"
              onChange={handleInput}
            />
          </div>
          <div className="col-start-2 row-start-4 relative">
            <button
              className="absolute right-1 bottom-1 rounded-md bg-blue-800 m-3 p-3"
              onClick={() => {
                addWebsite(website.current, url.current);
              }}
            >
              submit
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Add;

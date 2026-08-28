# Canvas-Formatter-Extension
Chrome Extension made to format Canvas' file viewer. By default, the file only takes up about 50% of the vertical, and 70% of the horizontal.

Extension removes white space, repetitive text, and moves the download button to the top tab of the page.


Before:

![alt text](https://github.com/orabbott/Canvas-Formatter-Extension/blob/main/Examples/Before.png)

After: 

![alt text](https://github.com/orabbott/Canvas-Formatter-Extension/blob/main/Examples/After.png)


## Building

Shared sources live in `src/`; only the manifest differs per browser
(`manifests/chrome.json`, `manifests/firefox.json`). `build.sh` assembles a
loadable extension for each:

```sh
./build.sh            # builds dist/chrome and dist/firefox
./build.sh firefox    # one target
```

Load `dist/chrome` via `chrome://extensions` → Load unpacked, or `dist/firefox`
via `about:debugging` → Load Temporary Add-on. `dist/` is generated and ignored
by git — edit `src/`, not the build output.

document.querySelector('h2').remove();
const link1 = document.querySelector('a[download="true"]');
const ref = link1.href;
const div = document.querySelector('a[download="true"]').closest('div');
const link2 = document.querySelector('li[aria-current="page"] a');
link2.href = ref;
link2.insertAdjacentHTML(
    "afterend",
    `<a href="${ref}" download style="margin-left:6px; vertical-align:middle;">
        <svg viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg"
             style="width:1em; height:1em; fill:currentColor; cursor:pointer;">
            <path d="m1807.093 1482.477 79.736 79.963-355.313 355.312H355.346L.035 1562.44l79.85-79.963 322.22 322.334H1484.76l322.334-322.334ZM997.677-.033v1167.02l355.313-355.313 79.962 79.85-491.858 491.633L449.46 891.524l79.962-79.85 355.313 355.313V-.033h112.941Z"
                  fill-rule="evenodd"></path>
        </svg>
    </a>`
  );
link2.setAttribute("alt", "Download file")
link2.remove();
div.style.fontSize = '12px';
div.remove();
document.querySelector('.ic-Layout-watermark')?.remove();
document.getElementById("sequence_footer").remove(); 
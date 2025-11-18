document.querySelector('h2').remove();
const link1 = document.querySelector('a[download="true"]');
const ref = link1.href;
const link2 = document.querySelector('li[aria-current="page"] a');
link2.href = ref;
const div = document.querySelector('a[download="true"]').closest('div');
div.remove();
document.querySelector('.ic-Layout-watermark')?.remove();
document.getElementById("sequence_footer").remove();

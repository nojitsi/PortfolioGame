const gameThumbnail = document.getElementById('gameThumbnail');
const cvThumbnail = document.getElementById('cvThumbnail');

function resetThumbnail(resettableThumb) {
    resettableThumb.style.zIndex = '7';
    resettableThumb.style.width = '50%';
}

function resizeThumbnail(resizableThumb, width) {
    resizableThumb.style.zIndex = '10';
    resizableThumb.style.width = width + 'px';
}

function processMouseMove(event) {
    let xValue = event.clientX;
    let documentWidth = window.innerWidth;
    let documentCenter = parseInt(documentWidth / 2);
    let width = xValue > documentCenter ? xValue : documentWidth - xValue;
    resizeThumbnail(xValue > documentCenter ? cvThumbnail : gameThumbnail, width);
    resetThumbnail(xValue > documentCenter ? gameThumbnail : cvThumbnail);
}

document.onmousemove = processMouseMove;
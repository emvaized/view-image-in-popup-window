document.addEventListener("DOMContentLoaded", init);

let dxToShow = 0, dyToShow = 0, scale = 1.0, image, stepsCounter = 0, mouseListener;
const minScale = 0.1, maxScale = 50.0, initialScale  = 1.0, initialDx = 0, initialDy = 0, transitionDuration = 300;
let rotationWrapper, scaleSlider, rotationStepsCounter = 0;
const rotationSteps = [0, 90, 180, 270, 360], scaleSteps = [1.0, 2.0, 4.0];
let mirroredX = false, mirroredY = false;

function init(){
    const imageUrl = window.location.href.split('?src=')[1];
    if (!imageUrl) return;

    image = document.getElementById('image');
    image.src = imageUrl;
    document.title = imageUrl;

    mouseListener = document.getElementById('mouseListener');
    rotationWrapper = document.getElementById('wrapper');
    scaleSlider = document.getElementById('scaleSlider');

    /// add mouse listeners
    setImageListeners();
    setPanelButtonsListeners();
    setScaleSlider();

    /// update window size on image load (in case we got it wrong)
    image.onload = function(){
        chrome.runtime.sendMessage({ action: 'updateExistingWindow', imageHeight: image.naturalHeight ?? image.clientHeight, imageWidth: image.naturalWidth ?? image.clientWidth });
    }
}

function setImageListeners(){
    /// scale on wheel
    mouseListener.addEventListener('wheel', imageWheelListener, { passive: false });
    /// move on pad down
    mouseListener.addEventListener('mousedown', function (e) {
        e.preventDefault();
        evt = e || window.event;
        if ("buttons" in evt) {
            if (evt.button == 1 || evt.button == 2) {
                /// Middle or right button to close view
                closeView();
            } else if (evt.button == 0) {
                /// Left button
                panMouseDownListener(e)
            }
            // else if (evt.button == 2) {
            //     /// Right button
            //     rotateMouseDownListener(e)
            // }
        }
    });
    /// Double click to scale up listener
    mouseListener.addEventListener('dblclick', function (e) {
        evt = e || window.event;
        if ("buttons" in evt) {
            if (evt.button == 0) {

                /// take the scale into account with the offset
                let xs = (e.clientX - dxToShow) / scale,
                    // ys = (e.clientY + window.scrollY - dyToShow) / scale;
                    ys = (e.clientY - dyToShow) / scale;

                let scaleValueWithinSteps = false;
                scaleSteps.forEach(function (step) {
                    if (scale == initialScale * step) scaleValueWithinSteps = true;
                })

                if (scaleValueWithinSteps) {
                    if (stepsCounter == scaleSteps.length - 1) {
                        stepsCounter = 0;
                        scale = initialScale;
                        // dxToShow = initialDx;
                        // dyToShow = initialDy;
                    }
                    else {
                        stepsCounter += 1;
                        scale = initialScale * scaleSteps[stepsCounter];
                        /// reverse the offset amount with the new scale
                        // dxToShow = e.clientX - xs * scale;
                        // dyToShow = e.clientY - ys * scale;
                    }
                    // image.style.transform = `translate(${dxToShow}px,${dxToShow}px)`;
                } else {
                    /// Return image to initial scale
                    scale = initialScale;
                    stepsCounter = 0;
                    rotationStepsCounter = 0;
                    rotationWrapper.style.transform = 'rotate(0deg)';

                    dxToShow = 0; dyToShow = 0;
                    image.style.transform = 'translate(0,0)';
                }

                if (image.style.transition == '')
                    image.style.transition = `transform ${transitionDuration}ms ease-in-out, scale ${transitionDuration}ms ease-in-out`;
                image.style.scale = scale;
                scaleSlider.value = scale;

                setTimeout(function(){
                    image.style.transition = '';
                }, transitionDuration)
            }
        }
    });
}

function setPanelButtonsListeners(){

    function applyTransform(){
        rotationWrapper.style.transform = `rotate(${rotationSteps[rotationStepsCounter]}deg)` + (mirroredX == true ? ` scaleX(-1)` : ' scaleX(1)') + (mirroredY == true ? `scaleY(-1)` : 'scaleY(1)');
    }

    /// rotate
    document.getElementById('rotateButton').addEventListener('mousedown', function () {
        rotationStepsCounter += 1;
        applyTransform();

        /// Revert index when rotation is 360
        if (rotationStepsCounter == rotationSteps.length - 1) {
            setTimeout(function () {
                rotationStepsCounter = 0;
                rotationWrapper.classList.add('noTransition');
                applyTransform();
                rotationWrapper.classList.remove('noTransition');
            }, transitionDuration)
        }
    });

    /// mirror
    document.getElementById('mirrorXButton').addEventListener('mousedown', function () {
        mirroredX = !mirroredX;
        applyTransform();
    });    
    
    document.getElementById('mirrorYButton').addEventListener('mousedown', function () {
        mirroredY = !mirroredY;
        applyTransform();
    });   
    
    /// fit screen
    document.getElementById('fitScreenButton').addEventListener('mousedown', function () {
        rotationWrapper.style.transition = `transform ${transitionDuration}ms ease-in-out`
        image.style.transition = `scale ${transitionDuration}ms ease-in-out, transform ${transitionDuration}ms ease-in-out`;
        rotationStepsCounter = 0;
        setTimeout(function(){
            rotationWrapper.style.transition = ``;
            image.style.transition = ``;
        }, transitionDuration);

        /// reset position
        dxToShow = 0;
        dyToShow = 0;
        image.style.transform = '';
        rotationWrapper.style.transform = '';

        /// reset scale
        scale = 1.0;
        image.style.scale = 1.0;
        scaleSlider.value = scale;
    });
}

function setScaleSlider(){
    /// Add scale slider
   scaleSlider.setAttribute('min', minScale);
   scaleSlider.setAttribute('max', 3.0);
   scaleSlider.setAttribute('step', 0.1);
   scaleSlider.value = scale;

   scaleSlider.addEventListener('input', function (e) {
       scale = parseFloat(scaleSlider.value).toFixed(2);
       image.style.scale = scale;
   })
}


function panMouseDownListener(e) {
    e.preventDefault();

    image.style.cursor = 'grabbing';
    document.body.style.cursor = 'move';
    image.style.transition = '';

    function mouseMoveListener(e) {
        dxToShow = dxToShow + e.movementX;
        dyToShow = dyToShow + e.movementY;

        // image.style.transform = `translate(${dxToShow}px, ${dyToShow}px) scale(${scale})`;
        image.style.transform = `translate(${dxToShow}px, ${dyToShow}px)`;
    }

    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mouseup', function () {
        document.body.style.cursor = 'unset';
        image.style.cursor = 'grab';
        document.removeEventListener('mousemove', mouseMoveListener);
    });
}

function imageWheelListener(e) {
    e.preventDefault();
    const wheelDelta = e.wheelDelta ?? -e.deltaY;
    scale += wheelDelta / 200;

    if (scale < minScale) scale = minScale;
    if (scale > maxScale) scale = maxScale;

    scale = parseFloat(scale);
    // image.style.transition = '';
    image.style.scale = scale;
    scaleSlider.value = scale;
}

function closeView() {

}

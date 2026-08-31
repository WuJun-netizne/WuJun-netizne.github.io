async function C_Request(args = {url, method, params}) {
    let config = Object.assign({method: "get", params: {}}, args)
    let result = null
    let loading = layer.load(2)
    switch (config.method) {
        case"get":
            result = await axios.get(config.url);
            break;
        case"post":
            result = await axios.post(config.url, config.params);
            break;
        case"put":
            result = await axios.put(config.url, config.params);
            break;
        case"delete":
            result = await axios.delete(config.url, {params: config.params});
            break;
    }
    layer.close(loading)
    if (result) {
        return {code: 200, msg: '请求成功', data: result.data}
    } else {
        return {code: 500, msg: "请求失败", data: {}}
    }
}

function C_OpenWindow(args = { title, area, content, callback, type }) {
    let { title, area, content, callback, type } = args;

    // 默认回调：检查 ref 并触发 submit 点击
    const defaultCallback = () => {
        let ref = window.localStorage.getItem("ref");
        if (ref === "ok") {
            window.localStorage.removeItem("ref");
            document.querySelector('.submit').click();
        }
    };

    // 如果没有传入回调，使用默认回调
    if (!callback) {
        callback = defaultCallback;
    }

    if (type === "confirm") {
        layer.confirm(content, {
            icon: 3,
            title: title,
            // 确认按钮回调
            yes: function (index) {
                callback(index);
                layer.close(index);
            },
            // 右上角关闭按钮回调
            cancel: function (index) {
                // 执行相同的 submit 点击逻辑，但不影响可能传入的自定义 callback 中的其他行为
                // if (callback === defaultCallback) {
                //     defaultCallback();
                // } else {
                //     // 如果用户提供了自定义 callback，关闭时也执行它（可根据实际需求修改）
                //     callback(index);
                // }
                layer.close(index);
            }
        });
    }

    if (type === "page") {
        layer.open({
            type: 2,
            title: title,
            content: [content],
            area: area,
            end: callback,      // 无论何种关闭方式都会触发（包括关闭按钮、ESC、遮罩）
            cancel: function (index) {
                // 显式处理关闭按钮：与 end 保持相同逻辑，避免某些版本文档不一致的问题
                if (callback) callback();
                //document.querySelector('.submit').click();
                layer.close(index);
            }
        });
    }
}

function C_OpenWindow_copy(args = {title, area, content, callback, type}) {
    let {title, area, content, callback, type} = args
    if (type == "confirm") {
        layer.confirm(title, {icon: 3, title: content}, function (index) {
            callback(index)
        })
    }
    if (!callback) {
        callback = () => {
            let ref = window.localStorage.getItem("ref")
            if (ref == "ok") {
                window.localStorage.removeItem("ref")
                document.querySelector('.submit').click()
            }
        }
    }
    if (type == "page") {
        layer.open({type: 2, title, content: [content], area, end: callback})
    }
}

function C_CloseWindow(time = 1000) {
    setTimeout(() => {
        window.localStorage.setItem("ref", "ok")
        parent.layer.close(parent.layer.getFrameIndex(window.name))
    }, time)
}

// 递归替换 null/undefined 为空字符串
function replaceNullWithEmpty(obj) {
    if (obj === null || obj === undefined) {
        return '';
    }
    if (Array.isArray(obj)) {
        return obj.map(item => replaceNullWithEmpty(item));
    }
    if (typeof obj === 'object') {
        // 只处理普通对象，不处理 Date、RegExp 等
        if (obj.constructor !== Object) {
            return obj;
        }
        const newObj = {};
        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = replaceNullWithEmpty(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
}

// 封装的表格渲染函数
function C_RenderTable(config = {url, elem, cols, done, error}) {
    // 预先保存用户自定义的 parseData（如果有的话）
    const userParseData = config.parseData;

    // 构建一个增强的 parseData
    const enhancedParseData = function(res) {
        // 1. 递归清洗整个返回数据中的所有 null/undefined
        const cleanedRes = replaceNullWithEmpty(res);

        // 2. 如果用户自定义了 parseData，则调用它获取自定义格式；否则使用默认格式
        let formatted;
        if (userParseData) {
            formatted = userParseData(cleanedRes);
        } else {
            // layui 默认的解析规则（根据你后端返回格式可能需要调整）
            formatted = {
                code: cleanedRes.code,
                msg: cleanedRes.msg,
                count: cleanedRes.count,
                data: cleanedRes.data
            };
        }
        return formatted;
    };

    return table.render(Object.assign({
        url: '',
        elem: '',
        height: 'full-120',
        page: true,
        limit: 35,
        limits: [10,15,25,35,45,55,100,500,1000,2000,5000],
        toolbar: '#toolbar',
        loading: true,
        cols: [[{}, {}, {}, {}, {}, {}, {}, {}]],
        parseData: enhancedParseData,   // 关键配置
        done: (res, curr, count) => {
            // 原有的 done 回调（如果用户传了，依然执行）
            if (config.done) config.done(res, curr, count);
        },
        error: (errObject, errContent) => {
            if (config.error) config.error(errObject, errContent);
        }
    }, config));
}

function C_RenderTable2(config = {url, elem, cols, done, error}) {
    return table.render(Object.assign({
        url: '',
        elem: '',
        height: 'full-120',
        page: true,
        limit: 25,
        limits: [25,50, 60, 70, 80, 90, 100],
        toolbar: '#toolbar',
        loading: true,
        cols: [[{}, {}, {}, {}, {}, {}, {}, {}]],
        done: (res, curr, count) => {
        },
        error: (errObject, errContent) => {
        }
    }, config))
}

function convertCanvasToImg(canvas, filename) {
    let myBlob = dataURLtoBlob(canvas.toDataURL('img/png', 1.0))
    let myUrl = URL.createObjectURL(myBlob)
    downImg(myUrl, filename)
}

function downImg(url, filename) {
    let a = document.createElement("a")
    let clickEvent = document.createEvent("MouseEvents")
    a.setAttribute("href", url)
    a.setAttribute("download", filename)
    a.setAttribute("target", '_blank')
    clickEvent.initEvent('click', true, true)
    a.dispatchEvent(clickEvent)
}

function dataURLtoBlob(dataurl) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?)/)[1], bstr = atob(arr[1]), n = bstr.length,
        u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], {type: mime})
}

function fixdata(data) {
    let o = "", l = 0, w = 10240;
    for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)))
    o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)))
    return o;
}

function ReadData(sheet) {
    let cellname = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ'];
    let cell_range = null;
    if (sheet['!ref']) {
        cell_range = sheet['!ref'].split(":")
    } else {
        return [];
    }
    let rowCount = cell_range[1].replace(/[^\d]/g, " ")
    let last_cell = cell_range[1].replace(/[^A-Z]/g, " ").trim()
    let data = [];
    for (let j = 1; j <= rowCount; j++) {
        let row = [];
        for (let i = 0; i < cellname.length; i++) {
            let cell = cellname[i];
            if (sheet[`${cell}${j}`] != undefined) {
                row.push(sheet[`${cell}${j}`].w)
            }
            if (cellname[i] == last_cell) {
                break;
            }
        }
        if (row.length != 0) {
            data.push(row)
        }
    }
    return data;
}

function handleExcel(obj) {
    let wb;
    let rABS = false;
    return new Promise((resolve, reject) => {
        try {
            if (!obj.files) {
                return;
            }
            let f = obj.files[0];
            let reader = new FileReader()
            reader.onload = function (e) {
                let data = e.target.result;
                if (rABS) {
                    wb = XLSX.read(btoa(fixdata(data)), {type: 'base64'})
                } else {
                    wb = XLSX.read(data, {type: 'binary'})
                }
                let SheetNames = wb.SheetNames;
                let arrays = [];
                SheetNames.map((item, index, arr) => {
                    arrays.push(ReadData(wb.Sheets[item]))
                })
                resolve(arrays)
            };
            if (rABS) {
                reader.readAsArrayBuffer(f)
            } else {
                reader.readAsBinaryString(f)
            }
        } catch (e) {
            reject("系统错误")
        }
    })
}

function sortTable(el) {
    return new Promise((resolve, reject) => {
        resolve(Sortable.create(el, {animation: 200, sort: true}))
    })
}

function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

window.toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],   // 字体样式：加粗、倾斜、下划线、删除线
    ['blockquote', 'code-block'],                // 引用块、代码块
    [{'header': 1}, {'header': 2}],           // 标题1、标题2
    [{'list': 'ordered'}, {'list': 'bullet'}],// 有序列表、无序列表
    [{'script': 'sub'}, {'script': 'super'}], // 下标、上标
    [{'indent': '-1'}, {'indent': '+1'}],     // 减少缩进、增加缩进
    [{'direction': 'rtl'}],                    // 从右向左文本方向
    [{'size': ['small', false, 'large', 'huge']}],// 字体大小
    [{'header': [1, 2, 3, 4, 5, 6, false]}],    // 标题1 - 标题6及普通段落
    [{'color': []}, {'background': []}],      // 字体颜色、背景颜色（可自定义颜色选择器）
    ['link', 'image', 'video'],                   // 插入链接、图片、视频
    ['clean']                                     // 清除格式
];
// 全局函数：处理 ozone.ru 图片链接，移除 /wc200/
function fixOzoneImageUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('ozone.ru') && url.includes('/wc200/')) {
        return url.replace('/wc200/', '/');
    }
    return url;
}
window.photosImages=function() {
    // 预处理预览容器内所有图片的 layer-src（预览大图地址）
    $('.photos').each(function() {
        $(this).find('img').each(function() {
            let $img = $(this);
            let layerSrc = $img.attr('layer-src');
            if (layerSrc) {
                let fixed = fixOzoneImageUrl(layerSrc);
                if (fixed !== layerSrc) {
                    $img.attr('layer-src', fixed);
                }
            } else {
                // 如果没有 layer-src，可依据 src 生成大图地址存入 data-original
                let src = $img.attr('src');
                if (src && src.includes('ozone.ru') && src.includes('/wc200/')) {
                    let original = src.replace('/wc200/', '/');
                    $img.attr('data-original', original);
                }
            }
        });
    });

    // 调用 layui 图片预览
    layer.photos({
        photos: '.photos',
        anim: 5,
        // 若使用了 data-original，需告诉 layer.photos 优先用 data-original
        src: function(img) {
            return $(img).attr('data-original') || $(img).attr('layer-src') || $(img).attr('src');
        }
    });

    // 滚轮缩放（原有代码不变）
    $(document).on("mousewheel DOMMouseScroll", ".layui-layer-phimg img", function(e) {
        var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) || (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));
        var imagep = $(".layui-layer-phimg").parent().parent();
        var image = $(".layui-layer-phimg").parent();
        var h = image.height();
        var w = image.width();
        if (delta > 0) {
            if (h < (window.innerHeight)) {
                h = h * 1.05;
                w = w * 1.05;
            }
        } else if (delta < 0) {
            if (h > 100) {
                h = h * 0.95;
                w = w * 0.95;
            }
        }
        imagep.css("top", (window.innerHeight - h) / 2);
        imagep.css("left", (window.innerWidth - w) / 2);
        image.height(h);
        image.width(w);
        imagep.height(h);
        imagep.width(w);
    });
}
window.photosImages3=function() {
    // 预处理预览容器内所有图片的 layer-src（预览大图地址）
    $('.photos3').each(function() {
        $(this).find('img').each(function() {
            let $img = $(this);
            let layerSrc = $img.attr('layer-src');
            if (layerSrc) {
                let fixed = fixOzoneImageUrl(layerSrc);
                if (fixed !== layerSrc) {
                    $img.attr('layer-src', fixed);
                }
            } else {
                // 如果没有 layer-src，可依据 src 生成大图地址存入 data-original
                let src = $img.attr('src');
                if (src && src.includes('ozone.ru') && src.includes('/wc200/')) {
                    let original = src.replace('/wc200/', '/');
                    $img.attr('data-original', original);
                }
            }
        });
    });

    // 调用 layui 图片预览
    layer.photos({
        photos: '.photos3',
        anim: 5,
        // 若使用了 data-original，需告诉 layer.photos 优先用 data-original
        src: function(img) {
            return $(img).attr('data-original') || $(img).attr('layer-src') || $(img).attr('src');
        }
    });

    // 滚轮缩放（原有代码不变）
    $(document).on("mousewheel DOMMouseScroll", ".layui-layer-phimg img", function(e) {
        var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) || (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));
        var imagep = $(".layui-layer-phimg").parent().parent();
        var image = $(".layui-layer-phimg").parent();
        var h = image.height();
        var w = image.width();
        if (delta > 0) {
            if (h < (window.innerHeight)) {
                h = h * 1.05;
                w = w * 1.05;
            }
        } else if (delta < 0) {
            if (h > 100) {
                h = h * 0.95;
                w = w * 0.95;
            }
        }
        imagep.css("top", (window.innerHeight - h) / 2);
        imagep.css("left", (window.innerWidth - w) / 2);
        image.height(h);
        image.width(w);
        imagep.height(h);
        imagep.width(w);
    });
}
window.photosImages2 = function () {
    layer.photos({photos: '.photos', anim: 5});
    $(document).on("mousewheel DOMMouseScroll", ".layui-layer-phimg img", function (e) {
        var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) || (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));
        var imagep = $(".layui-layer-phimg").parent().parent();
        var image = $(".layui-layer-phimg").parent();
        var h = image.height();
        var w = image.width();
        if (delta > 0) {
            if (h < (window.innerHeight)) {
                h = h * 1.05;
                w = w * 1.05;
            }
        } else if (delta < 0) {
            if (h > 100) {
                h = h * 0.95;
                w = w * 0.95;
            }
        }
        imagep.css("top", (window.innerHeight - h) / 2);
        imagep.css("left", (window.innerWidth - w) / 2);
        image.height(h);
        image.width(w);
        imagep.height(h);
        imagep.width(w);
    });
}
window.uploadImgToOss = function (elem, callback) {
    upload.render({
        elem: elem,
        url: "uploadsImg?floder=temp",
        // 选中文件准备上传时才开启loading
        before: function () {
            // 带文字加载层：正在上传图片
            window.uploadLoadIndex = layer.load(1);
        },
        done: function (res) {
            if (res.code == '0000') {
                callback(res.url)
            }
            layer.close(window.uploadLoadIndex);
            return false;
        }
    });
}
window.uploadImgToOss2 = function (elem, callback) {
    let i = layer.load(1);
    upload.render({
        elem: elem,
        url: "uploadsImg?floder=temp",
        done: function (res) {
            if (res.code == '0000') {
                layer.close(i)
                callback(res.url)
            }
            return false;
        }
    });
}
window.ysimg = function(file){
    return new Promise((resolve, reject) => {
        let imgCompressor = new ImgCompressor.Create({width: 500});
        let isys = false
        if(file.size>1024*1024*3) isys = true
        imgCompressor.compress(file, {
            success: function(result) {
                const formData = new FormData();
                if(isys){
                    if(result.size>1024*1024*3) ysimg(result)
                    formData.append('file', result, result.name);
                }else{
                    formData.append('file', file, file.name);
                }
                $.ajax({
                    url: "uploadsImg?floder=temp",
                    type: 'POST',
                    cache: false,
                    data: formData,
                    processData: false,
                    contentType: false
                })
                    .done(function(res) {
                        resolve(JSON.parse(res))
                    })
                    .fail(function(err) {
                        reject(err)
                    });
            },
            error: function(err) {
                reject(err)
            }
        })
    })
}
window.deleteById = function (id, table) {
    C_OpenWindow({
        type: "confirm", content: "确认删除吗？", title: "删除提示", callback: async function (index) {
            if(table=='shop'){
                await C_Request({
                    method: "put",
                    url: 'updateTable',
                    params: {table: table, id: id, status: -1, delete_time: getCurrentDateTime(),client_id:''}
                })
            }else{
                await C_Request({
                    method: "put",
                    url: 'updateTable',
                    params: {table: table, id: id, status: -1, delete_time: getCurrentDateTime()}
                })
            }
            layer.msg('已删除')
            $(".submit").click()
        }
    })
}

window.search = function (obj) {
    form.on("submit(submit)", function (data) {
        // 1. 记录滚动位置（先拿到旧的容器）
        let scrollContainerSelector = '.layui-table-body';   // 确保这是您表格实际滚动的容器
        let $oldContainer = $(scrollContainerSelector);
        let savedScrollTop = $oldContainer.scrollTop();

        // 2. 重新加载表格
        obj.reload({
            where: data.field,
            done: function() {
                // 3. reload 完成后重新获取容器并恢复滚动位置
                let $newContainer = $(scrollContainerSelector);
                if ($newContainer.length && savedScrollTop !== undefined && savedScrollTop !== null) {
                    // 微延时确保 DOM 布局完成（layui 表格渲染有时需要几毫秒）
                    setTimeout(() => {
                        $newContainer.scrollTop(savedScrollTop);
                        photosImages()
                        // 可选：打印调试信息，确认滚动设置成功
                        console.log('恢复滚动位置:', savedScrollTop, '实际scrollTop:', $newContainer.scrollTop());
                    }, 30);
                }
            }
        });
        return false;
    });
};

window.search2 = function (obj) {
    form.on("submit(submit)", function (data) {
        //obj.reload({page: {curr: 1}, where: data.field});
        obj.reload({where: data.field});
        return false;
    })
}
async function C_Request2(args = {url, method, params}) {
    let config = Object.assign({method: "get",params: {}}, args)
    let result = null
    switch (config.method) {
        case "get":result = await axios.get(config.url);break;
        case "post":result = await axios.post(config.url, config.params);break;
        case "put":result = await axios.put(config.url, config.params);break;
        case "delete":result = await axios.delete(config.url, {params: config.params});break;
    }
    if(result){
        return {code: 200, msg: '请求成功',data: result.data}
    }else{
        return {code: 500, msg: "请求失败",data:{}}
    }
}
window.handleQuillEdit = function () {
    return new Promise(async (resolve, reject) => {
        const content = app.quill.getContents();
        const semanticHTML = app.quill.getSemanticHTML();
        const base64Images = [];
        content.ops.forEach(op => {
            if (op.insert && op.insert.image && op.insert.image.startsWith('data:image')) {
                base64Images.push(op.insert.image);
            }
        });
        const data = {
            content: JSON.stringify(content),
            semanticHTML: semanticHTML,
            base64Images: base64Images
        };
        // 使用axios发送POST请求，你也可以使用其他方式，如fetch或jQuery的ajax
        let result = await axios.post('save_quill_edit', data)
        resolve(result.data.data)
    })
}

/**
 * 为 PNG blob 添加 DPI 元数据（pHYs chunk），返回新的 blob
 * @param {Blob} pngBlob 原始 PNG 的 Blob
 * @param {number} dpi 目标 DPI（例如 96）
 * @returns {Promise<Blob>}
 */
window.setPNGDPI = async function(pngBlob, dpi) {
    const ppm = Math.round(dpi * 39.3700787); // 每米像素数
    const buffer = await pngBlob.arrayBuffer();
    const data = new Uint8Array(buffer);

    // PNG 签名检查
    if (data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4E || data[3] !== 0x47) {
        throw new Error('Invalid PNG signature');
    }

    // 找到 IHDR chunk 结束位置
    let offset = 8; // 跳过 PNG 头
    let ihdrEnd = 0;
    while (offset < data.length) {
        const chunkLen = (data[offset] << 24) | (data[offset+1] << 16) | (data[offset+2] << 8) | data[offset+3];
        const chunkType = String.fromCharCode(data[offset+4], data[offset+5], data[offset+6], data[offset+7]);
        if (chunkType === 'IHDR') {
            ihdrEnd = offset + 8 + chunkLen + 4; // 跳过数据+CRC
            break;
        }
        offset += 12 + chunkLen; // length(4) + type(4) + data + crc(4)
    }
    if (!ihdrEnd) throw new Error('PNG missing IHDR chunk');

    // 检查是否已有 pHYs
    let physExists = false;
    let physStart = 0, physEnd = 0;
    offset = ihdrEnd;
    while (offset < data.length) {
        const chunkLen = (data[offset] << 24) | (data[offset+1] << 16) | (data[offset+2] << 8) | data[offset+3];
        const chunkType = String.fromCharCode(data[offset+4], data[offset+5], data[offset+6], data[offset+7]);
        if (chunkType === 'pHYs') {
            physExists = true;
            physStart = offset;
            physEnd = offset + 12 + chunkLen;
            break;
        }
        if (chunkType === 'IDAT') break; // 遇到 IDAT 就不再向后找
        offset += 12 + chunkLen;
    }

    // 构建新的 pHYs chunk
    const physChunkData = new Uint8Array(9);
    new DataView(physChunkData.buffer).setUint32(0, ppm, false);  // ppm X
    new DataView(physChunkData.buffer).setUint32(4, ppm, false);  // ppm Y
    physChunkData[8] = 1;  // 单位：米

    // CRC 计算
    function crc32(bytes) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }
    const crcTable = (() => {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }
        return table;
    })();
    const chunkTypeBytes = new Uint8Array([0x70, 0x48, 0x59, 0x73]); // 'pHYs'
    const chunkWithoutCRC = new Uint8Array(4 + physChunkData.length);
    chunkWithoutCRC.set(chunkTypeBytes, 0);
    chunkWithoutCRC.set(physChunkData, 4);
    const crcVal = crc32(chunkWithoutCRC);
    const fullChunk = new Uint8Array(4 + 4 + physChunkData.length + 4);
    new DataView(fullChunk.buffer).setUint32(0, physChunkData.length, false); // chunk length
    fullChunk.set(chunkTypeBytes, 4);
    fullChunk.set(physChunkData, 8);
    new DataView(fullChunk.buffer).setUint32(8 + physChunkData.length, crcVal, false);

    // 重组数据
    let newData;
    if (physExists) {
        // 替换原有的 pHYs chunk
        const before = data.slice(0, physStart);
        const after = data.slice(physEnd);
        newData = new Uint8Array(before.length + fullChunk.length + after.length);
        newData.set(before);
        newData.set(fullChunk, before.length);
        newData.set(after, before.length + fullChunk.length);
    } else {
        // 插入到 IHDR 后面
        const before = data.slice(0, ihdrEnd);
        const after = data.slice(ihdrEnd);
        newData = new Uint8Array(before.length + fullChunk.length + after.length);
        newData.set(before);
        newData.set(fullChunk, before.length);
        newData.set(after, before.length + fullChunk.length);
    }

    return new Blob([newData], { type: 'image/png' });
}

/**
 * 处理 ozone 图片 URL，移除尺寸路径（如 /wc200/）
 * @param {string} url - 原始图片 URL
 * @returns {string} 处理后的纯净 URL
 */
window.cleanOzoneImageUrl = function(url) {
    // 只处理 cdn1.ozone.ru 的图片
    if (!url.includes('cdn1.ozone.ru')) {
        return url;
    }

    // 定义可扩展的替换规则（以后加规则直接往这里加）
    const rules = [
        // 去掉 /wc200/ 这段路径
        { pattern: /\/wc200\//g, replacement: '/' },
        // 示例：以后可以继续加
        { pattern: /\/wc1000\//g, replacement: '/' },
        // { pattern: /\/wc400\//g, replacement: '/' },
    ];

    let result = url;
    rules.forEach(rule => {
        result = result.replace(rule.pattern, rule.replacement);
    });

    return result;
}

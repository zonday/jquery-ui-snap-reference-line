# Jquery UI 拖拽缩放增强

加入对齐参考线

## 使用

引入js

``` html
    // 必须在Jquery UI 之后引用
    <script src="../dist/jquery-ui-snap-ref-line.js"></script>
```

```javascript
    $('.box').draggable({
        snapRef: true, // 开启参考线
        snapRefLineColor: 'green', //参考线颜色
        snapRefTolerance: 30, // 参考线的出现距离
        snapTolerance: 20, // 吸附距离
        stop: function (event, ui) {
            console.log(ui);
        }
    });
    $('.box').resizable({
        handles: 'all',
        snapRef: true, // 开启参考线
        snapRefTolerance: 30, // 参考线的出现距离
        snapTolerance: 20, // 吸附距离
        stop: function(event, ui) {
            console.log(ui);
        }
    });
```

### 开发

```bash
npm run dev
```

### 编译

```bash
npm run build
```
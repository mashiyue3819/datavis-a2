// Waiting until document has loaded
window.onload = () => {

  // YOUR CODE GOES HERE
  console.log("YOUR CODE GOES HERE");
  // --- 1. 设置画布尺寸 ---
  const margin = { top: 40, right: 150, bottom: 60, left: 60 }; // 定义边距，右侧留宽给图例
  const width = 800 - margin.left - margin.right; // 计算绘图区域宽度
  const height = 600 - margin.top - margin.bottom; // 计算绘图区域高度

  // --- 2. 创建 SVG 容器 ---
  const svg = d3.select("#chart") // 选择 HTML 中的 #chart div
    .append("svg") // 添加 SVG 标签
    .attr("width", width + margin.left + margin.right) // 设置总宽度
    .attr("height", height + margin.top + margin.bottom) // 设置总高度
    .append("g") // 添加一个分组 g 元素
    .attr("transform", `translate(${margin.left},${margin.top})`); // 将绘图原点移动到边距内部

  // --- 3. 加载数据 ---
  // 注意：请确保你的 csv 文件名是 cars.csv，并且列名与代码中一致
  d3.csv("cars.csv").then(function (data) {
    console.log("CSV文件的所有列名:", data.columns);

    const cleanData = data.filter(d => {
      const mpg = +d["City Miles Per Gallon"];
      return mpg < 200;
    });

    // 数据清洗/转换：将字符串转为数字
    data.forEach(d => {
      d.Horsepower = +d["Horsepower(HP)"];           // 转为数字 (属性 1: X轴)
      d.City_MPG = +d["City Miles Per Gallon"]; // 转为数字 (属性 2: Y轴)
      d.Price = +d["Retail Price"];           // 转为数字 (属性 3: 大小)
      d.Type = d["Type"];               // d.Type 保持字符串 (属性 4: 颜色)
      d.Name = d["Name"]//Read the Name
      d.Hwy_MPG = +d["Highway Miles Per Gallon"]
      d.Engine = +d["Engine Size (l)"]
      d.Cyl = +d["Cyl"]

      if (isNaN(d.Horsepower)) {
        console.error("读取马力失败，请检查 CSV 列名。当前行数据:", d);
      }
    });

    // --- 4. 定义比例尺 (Scales) ---

    // X轴比例尺：线性
    const x = d3.scaleLinear()
      .domain([0, d3.max(cleanData, d => d.Horsepower)]) // 输入范围：0 到 最大马力
      .range([0, width]); // 输出范围：0 到 画布宽度

    // Y轴比例尺：线性
    const y = d3.scaleLinear()
      .domain([0, d3.max(cleanData, d => d.City_MPG)]) // 输入范围：0 到 最大油耗
      .range([height, 0]); // 输出范围：画布高度 到 0 (SVG Y轴向下，所以反转)

    // 大小比例尺：平方根 (用于圆面积映射，避免视觉误差)
    const r = d3.scaleSqrt()
      .domain([0, d3.max(cleanData, d => d.Price)]) // 输入范围：价格
      .range([3, 10]); // 输出范围：半径 3px 到 10px

    // 颜色比例尺：序数 (分类数据)
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.Type)) // 输入范围：所有车型
      .range(["#de5c5fff", "#8fcdffff", "#4DAF4A", "#0015fdff", "#6a5787ff"]);


    // --- 5. 绘制坐标轴 (Axes) ---

    const shape = d3.scaleOrdinal()
      .domain(data.map(d => d.Type))
      .range([
        d3.symbolCircle,
        d3.symbolTriangle,
        d3.symbolSquare,
        d3.symbolDiamond,
        d3.symbolStar
      ]);

    // 添加 X 轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`) // 移到底部
      .call(d3.axisBottom(x)); // 生成轴

    // X 轴标签
    svg.append("text")
      .attr("class", "axis-label") // 应用 CSS 样式
      .attr("x", width / 2) // 居中
      .attr("y", height + 40) // 放在轴下方
      .style("text-anchor", "middle") // 文本锚点居中
      .text("Horsepower (HP)"); // 文本内容

    // 添加 Y 轴
    svg.append("g")
      .call(d3.axisLeft(y)); // 生成轴

    // Y 轴标签
    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)") // 旋转文字
      .attr("x", -height / 2) // 旋转后 X 控制垂直位置，居中
      .attr("y", -40) // 旋转后 Y 控制水平位置
      .style("text-anchor", "middle")
      .text("City Miles Per Gallon");

    // --- 6. 绘制散点 (dots) ---



    const dots = svg.selectAll(".dot") // 选择所有圆(此时为空)
      .data(cleanData) // 绑定数据
      .enter() // 进入数据节点
      .append("path") // 对每个数据添加一个path
      .attr("class", "dot")
      .attr("transform", d => `translate(${x(d.Horsepower)},${y(d.City_MPG)})`)
      .attr("d", d3.symbol()
        .type(d => shape(d.Type))
        .size(d => {
          const radius = r(d.Price);
          return Math.PI * radius * radius;
        })
      )
      // .attr("cx", d => x(d.Horsepower)) // 设置圆心 X 坐标 (编码属性 1)
      // .attr("cy", d => y(d.City_MPG))   // 设置圆心 Y 坐标 (编码属性 2)
      // .attr("r", d => r(d.Price))       // 设置半径 (编码属性 3)
      .style("fill", d => color(d.Type)) // 设置填充颜色 (编码属性 4)
      .style("opacity", 0.7) // 设置透明度
      .style("stroke", "white"); // 设置白色边框，区分重叠点



    // --- 7. 添加交互 (Interactions) ---

    // 点击事件
    dots.on("click", function (event, d) {
      // event 是点击事件对象，d 是被点击那个点的数据

      // A. 处理视觉高亮
      // 先取消所有点的选中状态
      dots.classed("selected", false)
        .style("opacity", 0.7)
        .style("stroke", "white")
      //  .attr("r", d => r(d.Price)); // 恢复原始大小

      // 将当前被点击的点设置为选中状态
      d3.select(this)
        .classed("selected", true) // 添加 CSS 类 .selected
        .style("opacity", 1)
        .style("stroke", "black")

      // B. 更新详情面板 (Side Panel)
      const detailsDiv = document.getElementById("details");
      const infoContent = document.getElementById("info-content");

      // 显示详情面板
      document.getElementById("details").style.display = "block";

      // 填充 HTML 内容：展示作业要求的 "6个属性" 
      // 这里使用了 ES6 的模板字符串 ``
      document.getElementById("info-content").innerHTML = `
                    <div class="detail-item"><span class="detail-label">Name:</span> ${d["Name"]}</div>
                    <div class="detail-item"><span class="detail-label">Type:</span> ${d["Type"]}</div>
                    <div class="detail-item"><span class="detail-label">Price:</span> $${d["Retail Price"]}</div>
                    <div class="detail-item"><span class="detail-label">HP:</span> ${d["Horsepower(HP)"]}</div>
                    <div class="detail-item"><span class="detail-label">MPG (City):</span> ${d["City Miles Per Gallon"]}</div>
                    <div class="detail-item"><span class="detail-label">Cylinders:</span> ${d["Cyl"]}</div>
                `;

      drawStarplot(d);
    });

    // --- 8. 添加图例 (Legend) ---

    // 为每个车型类型创建一个图例项


    const legend = svg.selectAll(".legend")
      .data(color.domain()) // 获取颜色比例尺的所有分类
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${width + 20}, ${i * 20})`); // 垂直排列

    // 图例色块
    legend.append("path")
      .attr("x", 0)
      .attr("width", 12)
      .attr("height", 12)
      .style("fill", color);

    // 图例文字
    legend.append("path")
      .attr("d", d3.symbol()// 使用 d3.symbol 生成形状生成器
        .type(d => shape(d))// 关键：使用 shape 比例尺根据车型(d)获取对应的形状
        .size(80)// 设置一个固定的合适大小（面积为 80 平方像素）
      )
      // symbol 生成的形状中心在 (0,0)，我们需要将其平移到图例行的合适位置。
      // 这里平移到 (6, 6) 是为了让它在一个大约 12x12 的假想区域内居中。
      .attr("transform", "translate(6,6)")
      .style("fill", color)
      .style("stroke", "#888")
      .style("stroke-width", 0.5);

    legend.append("text")
      .attr("x", 18)
      .attr("y", 6)
      .attr("dy", ".35em") // 垂直微调
      .attr("class", "legend-text")
      .style("text-anchor", "start")
      .style("font-size","12px")
      .text(d => d);


  }).catch(function (error) {
    // 错误处理：如果找不到 csv 文件，控制台会报错
    console.error("Error loading the data: ", error);
    document.getElementById("chart").innerHTML = "<p style='color:red'>Error loading data. Please check if cars.csv exists.</p>";
  });
  // Load the data set from the assets folder:

  function drawStarplot(dataPoint) {
    //清空容器
    const container = d3.select("#info-content");


    //尺寸设置
    const width = 240;
    const height = 240;
    const margin = 30;
    const radius = Math.min(width, height) / 2 - margin;

    //创建SVG
    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2 + 5},${height / 2})`);

    //定义6个轴的数据配置，最大值根据数据集大概估算
    const features = [
      { name: "City MPG", value: dataPoint.City_MPG, max: 60 },
      { name: "Hwy MPG", value: dataPoint.Hwy_MPG, max: 60 },
      { name: "Price", value: dataPoint.Price, max: 200000 },
      { name: "Engine", value: dataPoint.Engine, max: 6 },
      { name: "Cylinders", value: dataPoint.Cyl, max: 12 },
      { name: "HP", value: dataPoint.Horsepower, max: 500 },
    ];

    //绘制背景网格（5个同心圆）
    const ticks = [0.2, 0.4, 0.6, 0.8, 1.0];
    ticks.forEach(t => {
      svg.append("circle")
        .attr("r", radius * t)
        .attr("fill", "none")//填充颜色设为 none
        .attr("stroke", "#e8e0e0")//设置边框颜色（浅灰色）
        .attr("stroke-dasharray", "3,3");//设置虚线样式（可选）
    });

    //绘制轴线和文字
    features.forEach((f, i) => {
      const angle = (Math.PI * 2 * i) / features.length;
      const lineX = radius * Math.sin(angle);
      const lineY = -radius * Math.cos(angle);
      const labelX = (radius + 15) * Math.sin(angle);
      const labelY = -(radius + 15) * Math.cos(angle);

      //轴线
      svg.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", lineX).attr("y2", lineY)
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1.5);

      //标签
      svg.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")//设置文字水平居中
        .attr("alignment-baseline", "middle")//设置文字垂直居中
        .style("font-size", "10px")
        .style("fill", "#666")
        .text(f.name);
    });

    //计算雷达图的路径点
    const coordinates = features.map((f, i) => {
      const angle = (Math.PI * 2 * i) / features.length;
      //计算比例：值/最大值（如果值缺失则设为0）
      const ratio = (f.value || 0) / f.max;
      const r = ratio * radius;
      return {
        x: r * Math.sin(angle),
        y: -r * Math.cos(angle)
      };
    });

    //绘制橙色多边形区域
    const linePath = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveLinearClosed);//闭合线条

    svg.append("path")
      .datum(coordinates)
      .attr("d", linePath)
      .attr("fill", "rgba(255,165,0,0.6)")
      .attr("stroke", "darkorange")
      .attr("stroke-width", 2);

    svg.append("text")
      .attr("y", -height / 2 + 9)
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text(dataPoint.Name);
  }

};

function index0(input) {
    input.placeholder = "Nhập mã hoặc tên";
    input.addEventListener("input", () => {
        console.log("✏️ Ô index 0:", input.value);
    });
}

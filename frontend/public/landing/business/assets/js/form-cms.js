$(function() {
    // ページが読み込まれた時にクラス付与
    $('.form_btn').addClass("disabled");

    // 入力欄の操作時
    $('.form-group.required .form-control, input[type="checkbox"]').change(function () {
        // 必須項目が空かどうかフラグ
        let flag = true;
        // 必須項目をひとつずつチェック
        $('.form-group.required .form-control').each(function() {
            // もし必須項目が空なら
            if ($(this).val() === "") {
                flag = false;
                return false; // ループを抜ける
            }
        });

        // チェックボックスをチェック
        $('input[type="checkbox"]').each(function() {
            // もしチェックボックスがチェックされていないなら
            if (!$(this).is(':checked')) {
                flag = false;
                return false; // ループを抜ける
            }
        });

        if (flag) {
            // 送信ボタンのクラスを有効にする
            $('.form_btn').removeClass("disabled");
        } else {
            // 送信ボタンのクラスを無効にする
            $('.form_btn').addClass("disabled");
        }
    });
});


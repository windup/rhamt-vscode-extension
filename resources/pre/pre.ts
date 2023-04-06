

const start = () => {
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    $(document).ready(function(){

        document.addEventListener('click', function(e) {
            console.log('handle open embedded report');
            // @ts-ignore
            var href = e.target.closest('a').href || '';
            console.log(href);
            var n = href.lastIndexOf('/');
            var report = href.substring(n + 1);
            console.log(report);
            n = report.indexOf('?');
            report = report.substring(0, n);
            console.log(report);
            vscode.postMessage({
                command: 'openReport',
                link: report
            });
            e.stopPropagation();
            e.preventDefault();
        }, false);

        $('a').click((e) => {
             console.log(e.target);
             const link = $(e.target).attr('href');
             if (!link) {
                // glyphicon
                console.log('Ignoring non-HTML link');
                e.stopPropagation();
                e.preventDefault();
                return;
             }
             console.log($(e.target).attr('href'));
             if (link.endsWith('.html')) {
                vscode.postMessage({
                    command: 'openLink',
                    link: $(e.target).attr('href')
                });
                e.stopPropagation();
                e.preventDefault();
            }
         });
     });
}

start();

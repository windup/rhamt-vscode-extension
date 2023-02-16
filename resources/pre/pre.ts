

const start = () => {
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    $(document).ready(function(){
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
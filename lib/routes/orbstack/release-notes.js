const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const rootUrl = 'https://docs.orbstack.dev';
    const currentUrl = `${rootUrl}/release-notes`;
    const response = await got({
        method: 'get',
        url: currentUrl,
    });

    const $ = cheerio.load(response.data);

    const list = $('#VPContent > div > div > div.content > div > main > div > div')
        .map((_, item) => {
            item = $(item);
            const title = item.find('h2').text();
            const content = item.find('ul').html();
            const version = title.split(' ')[0].toLowerCase().replace(/\./g, '-');
            return {
                title: title,
                description: content,
                link: `${currentUrl}#${version}`,
                pubDate: new Date().toUTCString()  
            };
        })
        .get();

    const items = await Promise.all(
        list.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                });
                const content = cheerio.load(detailResponse.data);

                const title = content('h1.wsite-content-title');

                item.description = title.next().next().next().html();
                item.pubDate = new Date(title.next().text()).toUTCString();

                return item;
            })
        )
    );

    ctx.state.data = {
        title: 'OneNote Gem Addins Release History',
        link: currentUrl,
        item: items,
    };
};

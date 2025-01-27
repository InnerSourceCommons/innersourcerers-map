// グローバル変数
let members = [];
let globe;
let countryCodesData = [];
let locationData = {};
let AREA_DATA = {};
let areaToCountryCode = {}; // グローバル変数として明示的に宣言

// アプリケーションの初期化
async function initializeApp() {
    try {
        // すべてのデータを並行して読み込む
        const [codes, locations, membersResponse] = await Promise.all([
            fetch('./data/code.json').then(response => response.json()),
            fetch('./data/locations.json').then(response => response.json()),
            fetch('./data/members.yaml').then(response => response.text())
        ]);

        // データを設定
        countryCodesData = codes;
        locationData = locations;
        members = jsyaml.load(membersResponse).members;

        // areaToCountryCodeマッピングを初期化
        countryCodesData.forEach(country => {
            areaToCountryCode[country.name.toLowerCase()] = country['country-code'];
            areaToCountryCode[country['alpha-2'].toLowerCase()] = country['country-code'];
            areaToCountryCode[country['alpha-3'].toLowerCase()] = country['country-code'];
        });

        // AREA_DATAを動的に生成
        Object.entries(locationData.countries).forEach(([countryCode, country]) => {
            if (country.capital) {
                // 国コードをキーとして使用
                AREA_DATA[countryCode] = {
                    center: country.capital.coordinates,
                    name: country.name,
                    countryCode: countryCode
                };
            }
            
            // 地域データがある場合は追加
            if (country.regions) {
                Object.entries(country.regions).forEach(([regionKey, region]) => {
                    // 地域名をキーとして使用（例：840_texas）
                    const areaKey = `${countryCode}_${regionKey}`;
                    AREA_DATA[areaKey] = {
                        center: region.coordinates,
                        name: `${region.name}, ${country.name}`,
                        countryCode: countryCode
                    };
                });
            }
        });

        console.log('Data loaded successfully:', {
            countryCodesData,
            locationData,
            AREA_DATA,
            members
        });

        // UIの初期化
        await initGlobe();
        updateMembersList();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// countryCodeからalpha-3を取得する関数
function getCountryAlpha3(countryCode) {
    const country = countryCodesData.find(c => c['country-code'] === countryCode);
    return country ? country['alpha-3'] : null;
}

// YAMLファイルからメンバーデータを読み込む
async function loadMembers() {
    try {
        const response = await fetch('./data/members.yaml');
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);
        members = data.members;
        updateMembersList();
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// 国コードデータの読み込み
async function loadCountryCodes() {
    try {
        const response = await fetch('./data/code.json');
        const countries = await response.json();
        // 国コードマッピングを修正
        countryCodesData = countries;
        console.log('Loaded country codes:', countryCodesData);
    } catch (error) {
        console.error('Error loading country codes:', error);
    }
}

// メンバーの国コードを収集
function calculateCountryColors() {
    if (!members || !AREA_DATA) {
        console.warn('Members or AREA_DATA not loaded yet');
        return () => '#E0E0E0';
    }

    // エリア名から国コードへのマッピングを作成
    const areaToCountryCode = {};
    countryCodesData.forEach(country => {
        // 国名を小文字に変換して格納
        areaToCountryCode[country.name.toLowerCase()] = country['country-code'];
        // alpha-2を小文字に変換して格納
        areaToCountryCode[country['alpha-2'].toLowerCase()] = country['country-code'];
        // alpha-3を小文字に変換して格納
        areaToCountryCode[country['alpha-3'].toLowerCase()] = country['country-code'];
    });

    // メンバーの国コードを収集
    const memberData = members.map(member => {
        const area = member.area.toLowerCase();
        console.log('Processing member area:', member.area, 'Available areas:', Object.keys(AREA_DATA));
        
        // 特別な地域の処理（例：usa_texas）
        if (area.includes('_')) {
            const [countryPart, regionPart] = area.split('_');
            const countryCode = areaToCountryCode[countryPart];
            const areaKey = `${countryCode}_${regionPart}`;
            if (AREA_DATA[areaKey]) {
                return {
                    country: getCountryAlpha3(countryCode),
                    area: member.area
                };
            }
        }

        // 通常の国の処理
        const countryCode = areaToCountryCode[area];
        if (!countryCode) {
            console.warn(`Area data not found for member area: ${member.area}`);
            return null;
        }

        // 国コードで直接AREA_DATAを検索
        if (!AREA_DATA[countryCode]) {
            console.warn(`Area data not found for country code: ${countryCode}`);
            return null;
        }

        return {
            country: getCountryAlpha3(countryCode),
            area: member.area
        };
    }).filter(Boolean);

    console.log('Member data:', memberData);

    return ({ id }) => {
        const countryData = countryCodesData.find(c => c['country-code'] === id);
        const countryCode = countryData ? countryData['alpha-3'] : null;
        const hasMembers = memberData.some(m => m.country === countryCode);
        return hasMembers ? '#4CAF50' : '#E0E0E0';
    };
}

// メンバーリストの更新
function updateMembersList() {
    const panel = document.getElementById('members-panel');
    if (!panel) return;

    panel.innerHTML = '<h2>Foundation Members</h2>';
    
    // 地域ごとにメンバーをグループ化
    const groupedMembers = {};
    members.forEach(member => {
        if (!groupedMembers[member.area]) {
            groupedMembers[member.area] = [];
        }
        groupedMembers[member.area].push(member);
    });
    
    // アクティブな地域を追跡
    let activeCard = null;

    // 地域ごとにカードを作成
    Object.entries(groupedMembers).forEach(([area, areaMembers]) => {
        const regionCard = document.createElement('div');
        regionCard.className = 'region-card';
        
        // エリアコードを取得
        let areaData;
        let countryCode;
        
        if (area.includes('_')) {
            // 地域の場合（例：840_texas）
            [countryCode] = area.split('_');
            areaData = AREA_DATA[area];
        } else {
            // 国の場合
            countryCode = areaToCountryCode[area.toLowerCase()];
            areaData = AREA_DATA[countryCode];
        }

        if (!areaData) {
            console.warn(`Area data not found for: ${area}`);
            return;
        }
        
        // データ属性とIDを追加
        regionCard.setAttribute('data-area', area);
        regionCard.setAttribute('data-country-code', countryCode);
        regionCard.id = `region-${countryCode}`;
        
        regionCard.innerHTML = `
            <h3>${areaData.name || area}</h3>
            <div class="member-count">${areaMembers.length} member(s)</div>
            <div class="member-list">
                ${areaMembers.map(member => `
                    <div class="member-item">
                        <div class="member-name">${member.name}</div>
                        <div class="member-role">${member.role}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // カードのクリックイベント
        regionCard.addEventListener('click', () => {
            if (activeCard) {
                activeCard.classList.remove('active');
            }
            regionCard.classList.add('active');
            activeCard = regionCard;

            if (areaData && areaData.center) {
                // 地球儀を該当地域に移動
                globe.pointOfView({
                    lat: areaData.center[1],
                    lng: areaData.center[0],
                    altitude: 1.5
                }, 1000);
            }
        });
        
        panel.appendChild(regionCard);
    });
}

// 3D地球儀の初期化
async function initGlobe() {
    console.log('Initializing globe...'); // デバッグ用ログ
    const container = document.getElementById('globe-container');
    
    try {
        console.log('Loading world data...'); // デバッグ用ログ
        // 世界地図データの読み込み
        const worldData = await fetch('https://unpkg.com/world-atlas/countries-110m.json').then(res => res.json());
        const worldCountries = topojson.feature(worldData, worldData.objects.countries);

        globe = Globe()(container)
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
            .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
            .lineHoverPrecision(0)
            .polygonsData(worldCountries.features)
            .polygonAltitude(0.01)
            .polygonCapColor(calculateCountryColors())
            .polygonSideColor(() => 'rgba(0, 100, 0, 0.15)')
            .polygonStrokeColor(() => '#FFFFFF')
            .polygonLabel(({ properties: d }) => {
                const countryCode = countryCodesData.find(c => c['alpha-3'] === d.ISO_A3)?.['country-code'];
                if (!countryCode) return null;

                const countryMembers = members.filter(m => {
                    const memberArea = m.area.toLowerCase();
                    if (memberArea.includes('_')) {
                        return memberArea.startsWith(countryCode.toLowerCase());
                    }
                    return areaToCountryCode[memberArea] === countryCode;
                });

                if (countryMembers.length > 0) {
                    return `
                        <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                            <div style="font-weight: bold; color: #2c3e50;">${d.NAME}</div>
                            <div style="color: #7f8c8d; margin-top: 5px;">Members: ${countryMembers.length}</div>
                            ${countryMembers.map(member => `
                                <div style="color: #7f8c8d; margin-top: 3px;">
                                    ${member.name} (${member.role})
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
                return null;
            })
            .onPolygonHover(hoverD => {
                if (hoverD) {
                    const countryCode = countryCodesData.find(c => c['alpha-3'] === hoverD.properties.ISO_A3)?.['country-code'];
                    if (countryCode) {
                        const hasMembers = members.some(m => {
                            const memberArea = m.area.toLowerCase();
                            if (memberArea.includes('_')) {
                                return memberArea.startsWith(countryCode.toLowerCase());
                            }
                            return areaToCountryCode[memberArea] === countryCode;
                        });
                        
                        if (hasMembers) {
                            globe.polygonAltitude(d => d === hoverD ? 0.12 : 0.01);
                            document.body.style.cursor = 'pointer';
                        }
                    }
                } else {
                    globe.polygonAltitude(0.01);
                    document.body.style.cursor = 'default';
                }
            })
            .onPolygonClick(({ properties: d }) => {
                console.log('Clicked polygon properties:', d);
                
                // 国名から国コードを取得
                const countryName = d.name.toLowerCase();
                const countryCode = areaToCountryCode[countryName];
                                
                console.log('Found country code from name:', countryCode);
                if (!countryCode) {
                    console.log('No country code found for name:', d.name);
                    return;
                }

                console.log(`Clicked country code: ${countryCode}`);

                // まず、すべてのアクティブなカードからフォーカスを外す
                const allActiveCards = document.querySelectorAll('.region-card.active');
                allActiveCards.forEach(card => card.classList.remove('active'));

                // メンバーがいる国かどうかを確認
                const countryMembers = members.filter(m => {
                    const memberArea = m.area.toLowerCase();
                    if (memberArea.includes('_')) {
                        return memberArea.startsWith(countryCode.toLowerCase());
                    }
                    return areaToCountryCode[memberArea] === countryCode;
                });

                if (countryMembers.length > 0) {
                    // IDを使って対象の要素を取得
                    const targetCard = document.getElementById(`region-${countryCode}`);
                    if (targetCard) {
                        // カードをアクティブにする
                        targetCard.classList.add('active');
                        
                        // 要素の位置までスクロール
                        targetCard.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'nearest'
                        });

                        // 対応する地域の座標を取得
                        const areaData = AREA_DATA[countryCode];
                        if (areaData && areaData.center) {
                            // 地球儀を該当地域に移動
                            globe.pointOfView({
                                lat: areaData.center[1],
                                lng: areaData.center[0],
                                altitude: 1.5
                            }, 1000);
                        }
                    }
                }
            })
            .polygonsTransitionDuration(300);

        // 地球儀の初期位置とコントロールの設定
        globe.controls().autoRotate = false;
        globe.controls().autoRotateSpeed = 0.5;
        globe.controls().enableZoom = true;
        
        // 初期視点を設定
        globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

        // ウィンドウリサイズ時の処理
        window.addEventListener('resize', () => {
            globe.width([window.innerWidth]);
            globe.height([window.innerHeight]);
        });

    } catch (error) {
        console.error('Error initializing globe:', error);
    }
}

// 国コードからエリア名を取得する関数
function getAreaNameFromCountryCode(countryCode) {
    const member = members.find(m => {
        const memberCountryCode = areaToCountryCode[m.area.toLowerCase()];
        return memberCountryCode === countryCode;
    });
    return member ? member.area : null;
}

// 地球儀のハイライトを更新
function updateGlobeHighlight(location, states = null) {
    globe.polygonLabel(({ properties: d, id }) => {
        if (location === 'USA') {
            // USAの場合、選択された州のみラベル表示
            const stateFips = properties?.STATEFP;
            const stateLocation = states?.find(state => 
                AREA_DATA[members.find(m => m.location === state).area].center[1] === properties?.INTPTLAT 
                && AREA_DATA[members.find(m => m.location === state).area].center[0] === properties?.INTPTLON
            );
            
            if (stateLocation) {
                const stateMembers = members.filter(m => m.location === stateLocation);
                return createLabel(stateLocation, stateMembers);
            }
        } else {
            const memberArea = members.find(m => m.location === location)?.area;
            const areaData = AREA_DATA[memberArea];
            if (areaData && d.ISO_A3 === getCountryAlpha3(areaData.countryCode)) {
                return createLabel(location, members.filter(m => m.location === location));
            }
        }
        return null;
    });

    globe.onPolygonHover(hoverD => {
        if (!hoverD) {
            globe.polygonAltitude(0.01);
            return;
        }

        if (location === 'USA') {
            const stateFips = hoverD.properties?.STATEFP;
            if (stateFips && states?.some(state => 
                AREA_DATA[members.find(m => m.location === state).area].center[1] === hoverD.properties?.INTPTLAT 
                && AREA_DATA[members.find(m => m.location === state).area].center[0] === hoverD.properties?.INTPTLON
            )) {
                globe.polygonAltitude(d => d === hoverD ? 0.12 : 0.01);
            }
        } else {
            const memberArea = members.find(m => m.location === location)?.area;
            const areaData = AREA_DATA[memberArea];
            if (areaData && hoverD.properties?.ISO_A3 === getCountryAlpha3(areaData.countryCode)) {
                globe.polygonAltitude(d => d === hoverD ? 0.12 : 0.01);
            }
        }
    });
}

// ラベルのHTML生成
function createLabel(location, locationMembers) {
    return `
        <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <div style="font-weight: bold; color: #2c3e50;">${location}</div>
            <div style="color: #7f8c8d; margin-top: 5px;">Members: ${locationMembers.length}</div>
            ${locationMembers.map(member => `
                <div style="color: #7f8c8d; margin-top: 3px;">
                    ${member.name} (${member.role})
                </div>
            `).join('')}
        </div>
    `;
}

// アプリケーションの起動
window.addEventListener('load', initializeApp); 
'use strict';

$(function (){
    let dashboard = {
        elements: {
            searchBarToggle: $('.js-search-bar-toggle'),
            searchBar: $('.js-search-bar'),
            searchForm: $('.js-search-form'),
            searchHistoryList: $('.js-search-history-list'),
            currentDayWeather: $('.js-current-day-weather'),
            dailyForecastList: $('.js-daily-forecast-list'),
            errorMesage: $('.js-error-message'),
        },
        searchHistory: JSON.parse(localStorage.getItem('searchHistory')) || [],
    };

    let weatherApiData = {
        url: 'https://api.openweathermap.org/data/2.5/',
        key: '8898e2111ad98a3e881d6f1be5289337',
        units: 'imperial',
        exclude: 'minutely,hourly,alerts',
    }

    function toggleSearchBar() {
        dashboard.elements.searchBar.toggleClass('closed');
    }

    /*---- Search -----*/

    function search(event) {
        // console.log('%c Search ', 'background-color: #333; color: #F2CEAE;');
        event.preventDefault();
        let targetElem = $(event.currentTarget);
        let isForm = targetElem.is('form');
        let isButton = targetElem.is('button[type="button"]');
        let searchCity = undefined;

        hideBlock(dashboard.elements.errorMesage);

        if (targetElem.closest(dashboard.elements.searchBar).length !== 0) {
            toggleSearchBar();
        }

        if (isForm) {
            searchCity = targetElem.find('input[type="search"]').val();
        }

        if (isButton) {
            searchCity = targetElem.data('search-query');
        }

        if (searchCity !== undefined 
        && searchCity !== '') {
            let request = `${weatherApiData.url}weather?q=${encodeURI(searchCity)}&appid=${weatherApiData.key}`;

            fetch(request)
                .then(function (response) {
                    if (response.ok) {
                        if (isForm) {
                            saveSearchHistory(searchCity);
                            displaySearchHistoryItem(searchCity);
                        }

                        return response.json();
                    } else {
                        showBlock(dashboard.elements.errorMesage);
                    }
                })
                .then(function (data) {
                    if (data !== undefined) {
                        displayCityName(data.name);
                        getWeatherDataByCoords(data.coord.lat, data.coord.lon);
                    }
                });
        }
    }

    function getWeatherDataByCoords(lat, lon) {
        // console.log('%c Get Weather Data By Coords ', 'background-color: #333; color: #4CB7EB;');
        let request = `${weatherApiData.url}onecall?lat=${lat}&lon=${lon}&exclude=${weatherApiData.exclude}&units=${weatherApiData.units}&appid=${weatherApiData.key}`;

        fetch(request)
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                }
            })
            .then(function (data) {
                if (data !== undefined) {
                    displayCurrentDayWeather(data.current);
                    displayDailyForecastList(data.daily);
                }
            });
    }

    /*---- END Search -----*/

    /*---- Search History -----*/

    function displaySearchHistoryList() {
        // console.log('%c Display Search History List ', 'background-color: #333; color: #D96704;');
        if (dashboard.searchHistory.length !== 0) {
            dashboard.searchHistory.forEach(displaySearchHistoryItem);
        }
    }

    function displaySearchHistoryItem(searchQuery) {
        // console.log('%c Display Search History Item ', 'background-color: #333; color: #D96704;');
        let listItem = $(`
            <li class="search-history-item">
                <button class="history-btn js-history-btn" type="button" data-search-query="${searchQuery.toLowerCase()}">${searchQuery}</button>
            </li>
        `);

        dashboard.elements.searchHistoryList.append(listItem);
    }

    function saveSearchHistory(searchQuery) {
        // console.log('%c Save Search History ', 'background-color: #333; color: #af3;');
        dashboard.searchHistory.push(searchQuery);
        localStorage.setItem('searchHistory', JSON.stringify(dashboard.searchHistory));
    }

    /*---- END Search History -----*/

    /*---- Display Weather Data -----*/

    function displayCityName(city) {
        dashboard.elements.currentDayWeather.find('.city-name').text(city);
    }

    function displayCurrentDayWeather(currentWeather) {
        // console.log('%c Display Current Day Weather ', 'background-color: #333; color: #D96704;');
        let container = dashboard.elements.currentDayWeather;

        let iconElem = container.find('.weather-icon');
        let temperatureElem = container.find('.temperature');
        let weatherDescElem = container.find('.weather-desc');
        let dateElem = container.find('.date');
        let feelsLikeElem = container.find('.feels-like');
        let windElem = container.find('.wind');
        let humidityElem = container.find('.humidity');
        let uvIndexElem = container.find('.uv-index');

        let iconImg = `<img src="http://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png" alt="${currentWeather.weather[0].description}">`;

        iconElem
            .text('')
            .append(iconImg);

        temperatureElem
            .text(Math.round(currentWeather.temp))
            .attr('data-metrica', '˚F');

        weatherDescElem
            .text(currentWeather.weather[0].main);

        dateElem
            .text(dayjs.unix(currentWeather.dt).format('dddd, MMMM D'));

        feelsLikeElem
            .text(Math.round(currentWeather.feels_like))
            .attr('data-metrica', '˚F');

        windElem
            .text(currentWeather.wind_speed)
            .attr('data-metrica', ' mph');

        humidityElem
            .text(currentWeather.humidity)
            .attr('data-metrica', ' %');

        uvIndexElem
            .text(currentWeather.uvi)
            .attr('data-level', getUVIndexLevel(currentWeather.uvi));

        showBlock(container);
    }

    function displayDailyForecastList(forecastWeather) {
        // console.log('%c Display Daily Forecast List ', 'background-color: #333; color: #D96704;');
        let container = dashboard.elements.dailyForecastList;
        const itemLimit = 6;

        container.text('');

        for (let i = 1; i <= itemLimit; i++) {
            let item = forecastWeather[i];

            container.append(`
                <li class="daily-forecast-item appear-anim" style="--anim-order: ${i};">
                    <p class="date">${dayjs.unix(item.dt).format('ddd, MMM DD')}</p>
                    <p class="weather-icon">
                        <img src="http://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}">
                    </p>
                    <p class="weather-desc">${item.weather[0].main}</p>
                    <p class="condition-item temperature">
                        <span class="day-temp" data-metrica="˚">${Math.round(item.temp.day)}</span>
                        <span class="condition-value night-temp" data-metrica="˚">${Math.round(item.temp.night)}</span>
                    </p>
                    <p class="condition-item">
                        Wind <span class="condition-value wind" data-metrica=" mph">${item.wind_speed}</span>
                    </p>
                    <p class="condition-item">
                        Humidity <span class="condition-value humidity" data-metrica="%">${item.humidity}</span>
                    </p>
                </li>
            `);
        }

        showBlock(container);
    }

    function getUVIndexLevel(uvIndex) {
        switch (Math.round(uvIndex)) {
            case 0:
            case 1:
            case 2:
                return 'low';
            case 3:
            case 4:
            case 5:
                return 'medium';
            case 6:
            case 7:
                return 'high';
            case 8:
            case 9:
            case 10:
                return 'very-high';
            default:
                return 'extremely-high';
        }
    }

    function showBlock(block) {
        if (block.hasClass('invisible')) {
            block.removeClass('invisible');
        }
    }

    function hideBlock(block) {
        if (!block.hasClass('invisible')) {
            block.addClass('invisible');
        }
    }

    /*---- END Display Weather Data -----*/

    function init() {
        // console.log('%c Init ', 'background-color: #333; color: #FFE849;');
        displaySearchHistoryList();

        dashboard.elements.searchBarToggle.on('click', toggleSearchBar);
        dashboard.elements.searchForm.on('submit', search);
        dashboard.elements.searchHistoryList.on('click', '.js-history-btn', search);
    }

    init();
});
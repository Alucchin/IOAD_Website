async function loadCSV(){

    const response = await fetch("AD trends.csv")
    const text = await response.text()

    const rows = text.trim().split("\n").map(r => r.split(","))

    const header = rows[0]
    const years = header.slice(2, -1)

    const countries = new Set()

    for(let i = 1; i < rows.length; i++){
        const row = rows[i]
        const fullLabel = row[1]

        if(!fullLabel) continue

        const country = fullLabel.replace(/ \(.*\)$/, '')
        countries.add(country)
    }

    const countryList = Array.from(countries)
    const countryColors = generateColors(countryList.length)
    const countryColorMap = {}

    countryList.forEach((c, idx) => {
        countryColorMap[c] = countryColors[idx]
    })

    const datasets = []

    for(let i = 1; i < rows.length; i++){

        const row = rows[i]
        const fullLabel = row[1]

        if(!fullLabel) continue

        const country = fullLabel.replace(/ \(.*\)$/, '')
        const isAssisted = fullLabel.includes('Assisted Suicide')
        const borderDash = isAssisted ? [5, 5] : []

        const values = row.slice(2, -1).map(v => {
            let num = Number(v)
            return num === 0 || isNaN(num) ? null : num
        })

        datasets.push({
            label: fullLabel,
            data: values,
            borderColor: countryColorMap[country],
            backgroundColor: countryColorMap[country],
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 7,
            pointHoverBorderWidth: 3,
            hoverBorderWidth: 4,
            borderDash: borderDash,
            tension: 0.25
        })
    }

    createChart(years, datasets)
}


function createChart(labels, datasets){

    const ctx = document.getElementById("myChart")

    const isMobile = window.innerWidth <= 600

    new Chart(ctx, {

        type: "line",

        data: {
            labels: labels,
            datasets: datasets
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "nearest",
                intersect: false
            },

            layout: {
                padding: isMobile ? 5 : 10
            },

            plugins: {

                legend: {
                    position: "top",

                    labels: {
                        boxWidth: isMobile ? 12 : 20,
                        boxHeight: isMobile ? 8 : 12,
                        padding: isMobile ? 5 : 10,
                        usePointStyle: true,

                        font: {
                            size: isMobile ? 10 : 14
                        },

                        generateLabels: function(chart) {

                            return chart.data.datasets.map((dataset, i) => ({

                                text: dataset.label,
                                fillStyle: dataset.borderColor,
                                strokeStyle: dataset.borderColor,
                                lineDash: dataset.borderDash || [],
                                lineWidth: 4,
                                hidden: !chart.isDatasetVisible(i),
                                pointStyle: "line",
                                datasetIndex: i

                            }))
                        }
                    }
                },

                tooltip: {

                    titleFont: {
                        size: isMobile ? 12 : 14
                    },

                    bodyFont: {
                        size: isMobile ? 11 : 13
                    },

                    callbacks: {

                        title: function(context){
                            return "Year: " + context[0].label
                        },

                        label: function(context){
                            return context.dataset.label + " : " +
                            (context.raw * 100).toFixed(2) + "%"
                        }

                    }
                }
            },

            hover: {
                mode: "dataset",
                intersect: false
            },

            scales: {

                x: {

                    title: {
                        display: true,
                        text: "Year",
                        font: {
                            size: isMobile ? 11 : 14
                        }
                    },

                    ticks: {
                        font: {
                            size: isMobile ? 9 : 12
                        },
                        maxRotation: isMobile ? 45 : 0,
                        minRotation: isMobile ? 45 : 0
                    }
                },

                y: {

                    title: {
                        display: true,
                        text: "Proportion of total deaths",
                        font: {
                            size: isMobile ? 10 : 14
                        }
                    },

                    ticks: {

                        maxTicksLimit: isMobile ? 6 : 10,

                        font: {
                            size: isMobile ? 9 : 12
                        },

                        callback: function(value){
                            return (value * 100).toFixed(3) + "%"
                        }
                    }
                }
            }
        }
    })
}


function generateColors(n){

    const basicColors = [
        '#1f77b4',
        '#ff7f0e',
        '#2ca02c',
        '#d62728',
        '#9467bd',
        '#8c564b',
        '#e377c2',
        '#7f7f7f',
        '#bcbd22',
        '#17becf'
    ]

    const colors = []

    for(let i = 0; i < n; i++){
        colors.push(basicColors[i % basicColors.length])
    }

    return colors
}


loadCSV()
